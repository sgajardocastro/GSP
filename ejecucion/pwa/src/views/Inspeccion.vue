<template>
  <v-container class="protocol-inspection-view" style="padding-bottom: 80px;">

    <!-- 🔶 Aviso de cola offline de inspecciones -->
    <v-row dense class="mb-2" v-if="cola && cola.length">
      <v-col cols="12">
        <v-alert type="warning" variant="tonal" density="comfortable">
          <strong>Pendiente de sincronizar ({{ cola.length }})</strong>
        </v-alert>
      </v-col>
    </v-row>
    <v-row dense>
      <v-col cols="12" v-for="survey in surveyDetailStore.surveyDetail" :key="survey.id_survey">
        <!-- Panel principal del documento -->
        <v-expansion-panels multiple>
          <v-expansion-panel class="sombra-resaltada">
            <v-expansion-panel-title color="primary">
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
              <v-row dense>
                <v-col cols="12">
                  <template v-if="useCompactConexionHeader(survey)">
                    <div class="conexion-header-simple">
                      <div class="conexion-header-simple__top">
                        <div class="conexion-header-simple__meta-pill" :title="`IC ${getConexionHeaderData(survey).ic}`">
                          IC {{ getConexionHeaderData(survey).ic }}
                        </div>
                        <div class="conexion-header-simple__meta-pill" :title="`NR ${getConexionHeaderData(survey).numeroReclamo}`">
                          NR {{ getConexionHeaderData(survey).numeroReclamo }}
                        </div>
                        <div class="conexion-header-simple__meta-pill" :title="`OT ${getConexionHeaderData(survey).orden}`">
                          OT {{ getConexionHeaderData(survey).orden }}
                        </div>
                      </div>

                      <div class="conexion-header-simple__address">
                        {{ getConexionHeaderData(survey).direccion }}
                      </div>

                      <div class="conexion-header-simple__people">
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Proyecto</span>
                          <span class="conexion-header-simple__value-inline">{{ getConexionHeaderData(survey).proyecto }}</span>
                        </div>
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Comuna</span>
                          <span class="conexion-header-simple__value-inline">{{ getConexionHeaderData(survey).comuna }}</span>
                        </div>
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Técnico</span>
                          <span class="conexion-header-simple__value-inline">{{ getConexionHeaderData(survey).tecnico }}</span>
                        </div>
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Sup. Metrogas</span>
                          <span class="conexion-header-simple__value-inline">{{ getConexionHeaderData(survey).supMetrogas }}</span>
                        </div>
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Sup. Terracon</span>
                          <span class="conexion-header-simple__value-inline">{{ getConexionHeaderData(survey).supTerracon }}</span>
                        </div>
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Estado</span>
                          <span class="conexion-header-simple__value-inline">{{ getConexionHeaderData(survey).estado }}</span>
                        </div>
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Obs. Terracon</span>
                          <span class="conexion-header-simple__value-inline conexion-header-simple__value-inline--multiline">{{ getConexionHeaderData(survey).observacionTerracon }}</span>
                        </div>
                        <div class="conexion-header-simple__person-line">
                          <span class="conexion-header-simple__label-inline">Contenido Reclamo</span>
                          <span class="conexion-header-simple__value-inline conexion-header-simple__value-inline--multiline">{{ getConexionHeaderData(survey).contenidoReclamo }}</span>
                        </div>
                      </div>
                    </div>
                  </template>
                  <template v-else>
                    <strong>Área:</strong> {{ survey.name_area }}<br />
                    <strong>Familia:</strong> {{ survey.name_tipo_srv }} ({{ survey.codi_tipo_srv }})<br />
                    <strong>{{ survey.desc_template_srv }}:</strong> {{ survey.name_template_srv }}<br />
                    <strong>Código:</strong> {{ survey.codi_template_srv }}<br />
                    <strong>Id Documento:</strong> {{ survey.id_survey }}<br />
                    <strong>{{ survey.name_empresa_cliente }}</strong> / {{ survey.nombre_proyecto }}<br />
                    <strong>Fechas Plan:</strong> {{ survey.fecha_plan_ini }} - {{ survey.fecha_plan_fin }}<br />
                    <strong>Fechas Real:</strong> {{ survey.fecha_real_ini ?? '---' }} - {{ survey.fecha_real_fin ?? '---'
                    }}
                  </template>
                </v-col>
              </v-row>

              <!-- Paneles por segmento -->

            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <br>

        <!-- ================= NO PPD: se mantiene tu comportamiento actual ================= -->
        <v-expansion-panels multiple v-if="!isPPDTemplate(survey)">
          <v-expansion-panel v-for="(segmento, index) in getSegmentosVisibles(survey)" :key="segmento.posicion ?? index"
            class="mb-5">
            <v-expansion-panel-title class="font-weight-bold segment-header flex-column align-stretch pa-0" style="font-size: 15px;">
              <div class="d-flex align-center justify-space-between w-100 py-3 px-3">
                <div class="d-flex align-center gap-2" style="max-width: calc(100% - 65px);">
                  <v-icon 
                    :icon="getSegmentProgress(segmento, survey).isComplete ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'" 
                    :color="getSegmentProgress(segmento, survey).isComplete ? '#10b981' : '#64748b'" 
                    class="mr-1"
                    size="20" 
                  />
                  <span class="text-truncate">{{ segmento.label || `Segmento ${index + 1}` }}</span>
                </div>
                <span 
                  class="font-mono text-caption font-weight-bold px-2 py-0.5 rounded-pill mr-2"
                  :style="getSegmentProgress(segmento, survey).isComplete 
                    ? 'background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);' 
                    : 'background: rgba(30, 41, 59, 0.8); color: #94a3b8; border: 1px solid rgba(71, 85, 105, 0.4);'"
                >
                  {{ getSegmentProgress(segmento, survey).filled }}/{{ getSegmentProgress(segmento, survey).total }}
                </span>
              </div>
              <div class="w-100" style="height: 3px; background: rgba(30, 41, 59, 0.8);">
                <div 
                  style="height: 100%; transition: width 0.3s ease;"
                  :style="{ 
                    width: `${getSegmentProgress(segmento, survey).percentage}%`,
                    background: getSegmentProgress(segmento, survey).isComplete ? '#10b981' : '#38bdf8'
                  }"
                ></div>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text
              :class="['segment-body', { 'segment-body-readonly': isReclamosConSurveySegment(segmento) }]"
            >
              <v-row :class="useCompactConexionHeader(survey) ? 'py-1' : 'py-5'">
                <v-col v-for="(attr, i) in getVisibleAttributesBySegment(segmento)" :key="i" cols="12">
                  <!-- 🔹 TODO lo que ya tenías de tipos: textField, number, datePicker, etc -->
                  <!-- (deja aquí *idéntico* tu block largo de v-else-if por type) -->
                  <!-- ... TODO TU CÓDIGO ACTUAL DE ATRIBUTOS AQUÍ ... -->
                  <div v-if="attr.type === 'textField'">
                    <!-- Si es un atributo de solo lectura del sistema (sin borde verde interactivo) -->
                    <div v-if="attr.roles && attr.roles.includes('SYSTEM')" class="system-readonly-card mb-2 p-2.5 rounded-lg bg-[#0b1329]/60 border border-slate-700/40">
                      <span class="d-block text-caption font-weight-bold text-slate-400 uppercase tracking-wider mb-1">{{ attr.label }}</span>
                      <span class="d-block text-body-2 font-weight-bold text-slate-100 font-mono">{{ getSystemFieldValue(attr, survey) || 'No especificado' }}</span>
                    </div>
                    <v-text-field v-else variant="outlined" v-model="attr.default" :label="attr.label" dense hide-details
                      density="compact" :disabled="!puedeEditar(attr)"
                      :class="attr.nullable === false && !attr.default ? 'text-custom-red' : ''" @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }" />
                  </div>

                  <div v-else-if="attr.type === 'number'">
                    <v-text-field variant="outlined" v-model="attr.default" :label="attr.label" dense hide-details
                      density="compact" type="number" :disabled="!puedeEditar(attr)"
                      :class="attr.nullable === false && !attr.default ? 'text-custom-red' : ''" @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }" />
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

                  <div v-else-if="attr.type === 'decimal'">
                    <v-text-field variant="outlined" v-model="attr.default" :label="attr.label" density="compact"
                      hide-details inputmode="decimal" :step="decimalStep(attr)"
                      :disabled="!puedeEditar(attr)"
                      :class="attr.nullable === false && !attr.default ? 'text-custom-red' : ''"
                      @keypress="onlyDecimalKeypress" @blur="() => normalizeDecimalAttr(attr)"
                      @update:model-value="() => segmentosCompletos()" />
                  </div>

                  <div v-else-if="attr.type === 'datePicker'">
                    <v-text-field variant="outlined" v-model="attr.default" :label="attr.label" type="date" dense
                      hide-details density="compact" :disabled="!puedeEditar(attr)"
                      :class="attr.nullable === false && !attr.default ? 'text-red' : ''" @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }" />
                  </div>

                  <div v-else-if="attr.type === 'dateHourPicker'">
                    <v-text-field variant="outlined" v-model="attr.default" :label="attr.label" type="datetime-local"
                      dense density="compact" hide-details :disabled="!puedeEditar(attr)"
                      :class="attr.nullable === false && attr.default == 'sysdatehhmm' ? 'text-red' : ''"
                      @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }" />
                  </div>

                  <div v-else-if="attr.type === 'checkList'">
                    <v-row dense>
                      <v-col v-for="(item) in attr.checkBoby" :key="item.id" cols="12">
                        <div class="checklist-item-row">
                          <div class="checklist-item-label font-weight-medium mb-1">
                            {{ item.label }}
                          </div>
                          <v-btn-toggle
                            v-model="item.default"
                            mandatory
                            density="compact"
                            class="mb-2 checklist-toggle"
                            @update:model-value="(val) => {
                              attr.default = val;
                              segmentosCompletos(); // tu función
                            }"
                          >
                            <v-btn
                              v-for="option in item.options"
                              :key="option.id || option.value"
                              :disabled="!puedeEditar(attr)"
                              :value="option.id || option.value"
                              size="small"
                              class="checklist-toggle-btn"
                            >
                              {{ option.label || option.value }}
                            </v-btn>
                          </v-btn-toggle>
                        </div>
                        <v-textarea v-if="item.obs !== undefined" variant="outlined" v-model="item.obs"
                          :disabled="!puedeEditar(attr)" label="Observaciones" rows="2" auto-grow hide-details
                          class="bg-white" />
                      </v-col>
                    </v-row>
                  </div>

                  <CheckListTecles
                    v-else-if="['checkListTecles', 'checkListTecle', 'CHECK LIST TECLES'].includes(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <div v-else-if="attr.type === 'comboBox'">
                    <v-row dense>
                      <v-col v-if="attr.values" :key="attr.values.id" cols="12">
                        <div style="display: flex; gap: 1rem;">
                          <div style="flex: 1;" class="font-weight-medium mb-1">
                            {{ attr.values.quest || attr.label || 'Seleccione una opción' }}
                          </div>
                          <div style="flex: 2;">
                            <v-select density="compact" variant="outlined" v-model="attr.values.selected"
                              :disabled="!puedeEditar(attr)" :items="getSelectItems(attr.values.options, attr, survey)"
                              item-title="label" item-value="value" dense hide-details label="Selecciona una opción"
                              class="bg-white" @update:model-value="(val) => {
                                attr.default = val;
                                segmentosCompletos(); // tu función
                              }">
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
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <div v-else-if="attr.type === 'photoCapture'">
                    <v-row>
                      <v-col :class="useCompactConexionHeader(survey) ? 'pb-2' : 'pb-12'">
                        <div>
                          <FotoCapture :label="attr.label" :max-fotos="attr.maxFotos" :obligatorio-fotos="0"
                            :compression="attr.compression" :compact="useCompactConexionHeader(survey)"
                            v-model:galeria="attr.galeria" v-model:observacion="attr.obs" :disabled="!puedeEditar(attr)"
                            @update:galeria="(val) => onPhotoCaptureGaleriaUpdate(attr, val)"
                            @update:observacion="segmentosCompletos()" />
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
                            :geoVisita="attr.geoVisita || attr.default?.geoVisita || attr.value?.geoVisita || attr.value"
                            @update:modelValue="(val) => { attr.default = val; segmentosCompletos(); }"
                            @update:geoVisita="(val) => { 
                              attr.geoVisita = val; 
                              if (typeof attr.default === 'object' && attr.default) { 
                                attr.default.geoVisita = val; 
                              } else { 
                                attr.default = { geoVisita: val }; 
                              } 
                              attr.value = val; 
                              segmentosCompletos(); 
                            }" 
                          />
                        </div>
                      </v-col>
                    </v-row>
                  </div>

                  <div v-else-if="attr.type === 'textArea'" style="padding-top: 5px;">
                    <v-textarea variant="outlined" v-model="attr.default" :label="attr.label" dense hide-details
                      :disabled="!puedeEditar(attr)" class="bg-white"
                      :class="attr.nullable === false && !attr.default ? 'text-custom-red' : ''" @update:model-value="(val) => {
                        attr.default = val;
                        segmentosCompletos(); // tu función
                      }" />
                  </div>

                  <div v-else-if="attr.type === 'photo'" class="pb-5">
                    <div class="font-weight-medium mb-1">{{ attr.label || 'Picture' }}</div>
                    <v-img width="100%" aspect-ratio="16/9" cover :src="attr.src"></v-img>
                  </div>

                  <div v-else-if="attr.type === 'fileUpload'">
                    <v-row>
                      <v-col class="pb-12">
                        <div>
                          <FileUpload :max-fotos="attr.maxArchivos" v-model:archivos="attr.archivos"
                            :disabled="!puedeEditar(attr)" v-model:observacion="attr.obs"
                            @update:archivos="() => segmentosCompletos()" />
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
                    <FotoCeck v-if="attr.type === 'photoCheck'" :label="attr.label" :model-value="attr.default"
                      :cantidad="attr.cantidad"
                      :unit="attr.unit"
                      :has-cantidad="attr.hasCantidad"
                      :fecha-vencimiento="attr.fechaVencimiento"
                      :has-vencimiento="attr.hasVencimiento"
                      @update:model-value="(val) => {
                        attr.default = val;
                        // Regla para Template 110 (Charla/ATS): Si no es 'si', limpia galería
                        if (isTemplate110 && (attr.label === 'Charla' || attr.label === 'ATS') && val !== 'si') {
                          attr.galeria = [];
                        }
                        segmentosCompletos();
                      }" 
                      @update:cantidad="(val) => { attr.cantidad = val; segmentosCompletos(); }"
                      @update:fecha-vencimiento="(val) => { attr.fechaVencimiento = val; segmentosCompletos(); }"
                      :galeria="attr.galeria" :observacion="attr.obs" :options="attr.options"
                      :compression="attr.compression || 10" @update:galeria="val => { attr.galeria = val; segmentosCompletos(); }"
                      @update:observacion="val => { attr.obs = val; segmentosCompletos(); }" :bloquear-foto="isBlockedFotoCheck(attr)" />
                  </div>

                  <div v-else-if="attr.type === 'qr'" style="padding-top: 5px;">
                    <LeerQr></LeerQr>
                  </div>

                  <MatrizCombustible v-else-if="attr.type === 'matrizCombustible'" :attr="attr" />

                  <MatrizEditable v-else-if="attr.type === 'matriz'" :attr="attr" />

                  <MatrizExcavaciones v-else-if="attr.type === 'matrizExcavaciones'" :attr="attr" />

                  <MatrizBorewrap v-else-if="attr.type === 'matrizBorewrap'" :attr="attr" />

                  <MatrizTransp v-else-if="attr.type === 'matrizTransp'" :attr="attr" />

                  <MatrizGranallado v-else-if="attr.type === 'matrizGranallado'" :attr="attr" />

                  <MatrizProtal v-else-if="attr.type === 'matrizProtal'" :attr="attr" />

                  <MatrizPolypipe v-else-if="attr.type === 'matrizPolypipe'" :attr="attr" />

                  <MatrizSoldadura v-else-if="attr.type === 'matrizSoldadura'" :attr="attr" />

                  <MatrizCheck
                    v-else-if="attr.type === 'matrizCheck'"
                    :attr="attr"
                    @change="segmentosCompletos"
                  />

                  <ArtefactosCheck
                    v-else-if="attr.type === 'ArtefactosCheck' || attr.type === 'artefactosCheck'"
                    :attr="attr"
                  />

                  <AsignarEquipo v-else-if="attr.type === 'asignarEquipo'" :attr="attr" />

                  <EstructuraMultiple v-else-if="attr.type === 'resgistroAdd'" :attr="attr" />

                  <RegistroEventos v-else-if="attr.type === 'registroEventos'" :attr="attr" />

                  <MatrizMAObsyRecomenaciones
                    v-else-if="['matrizMAObsyRecomenaciones', 'matrizMAObsyRecomendaciones'].includes(attr.type)"
                    :attr="attr"
                  />

                  <IngresoZanja
                    v-else-if="attr.type === 'ingresoZanja'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <ChequeoExtensionElectrica
                    v-else-if="attr.type === 'chequeoExtensionElectrica'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckMonofasicoTrifasico
                    v-else-if="attr.type === 'checkMonofasicoTrifasico'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <Vibropison
                    v-else-if="attr.type === 'vibropison'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <ChequeoSeguridadBetonera
                    v-else-if="attr.type === 'chequeoSeguridadBetonera'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckeoMartilloDemoledor
                    v-else-if="attr.type === 'checkeoMartilloDemoledor'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckEquiposIluminacion
                    v-else-if="attr.type === 'checkEquiposIluminacion'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckDispensadorAguaPotable
                    v-else-if="attr.type === 'checkDispensadorAguaPotable'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckListHerramientasManuales
                    v-else-if="['checkListHerramientasManuales', 'checklistHerramientasManuales', 'CHECK LIST HERRAMIENTAS MANUALES'].includes(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckListComunicacionRadialDmh
                    v-else-if="isComunicacionRadialDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListConformidadSegregacionDmh
                    v-else-if="isConformidadSegregacionDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListInspeccionEprDmh
                    v-else-if="isInspeccionEprDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEstabilidadSueloDmh
                    v-else-if="isEstabilidadSueloDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListAseoDesinfeccionDmh
                    v-else-if="isAseoDesinfeccionDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListControlNeumaticosDmh
                    v-else-if="isControlNeumaticosDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListElementosVisibilidadDmh
                    v-else-if="isElementosVisibilidadDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamionPlumaAmsa
                    v-else-if="isCamionPlumaAmsaType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamionetaAmsa
                    v-else-if="isCamionetaAmsaType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListGruaHorquillaAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListGruaHorquillaAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListGruaHorquillaPostUsoAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListGruaHorquillaPostUsoAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListGruaMovilAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListGruaMovilAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCancamosAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListCancamosAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEslingaCadenasAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListEslingaCadenasAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEslingasPoliesterAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListEslingasPoliesterAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEslingasTubularesAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListEslingasTubularesAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEstrobosAceroAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListEstrobosAceroAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListFajasAmarreAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListFajasAmarreAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListGrilletesAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListGrilletesAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListArnesSeguridadAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListArnesSeguridadAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCajaInviernoAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListCajaInviernoAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEscalasPortatilesAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListEscalasPortatilesAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListInspeccionEppAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListInspeccionEppAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListExtintoresAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListExtintoresAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListControlLicenciasAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListControlLicenciasAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCancamosPdfAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListCancamosPdfAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEscalaTipoAvionAmsa
                    v-else-if="isAmsaType(attr.type, 'checkListEscalaTipoAvionAmsa')"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListAmsaBase
                    v-else-if="isTransmacGeneratedType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    :checklist-id="getTransmacChecklistId(attr.type)"
                    @change="segmentosCompletos"
                  />

                  <CheckListAmsaBase
                    v-else-if="isCdchGeneratedType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    :checklist-id="getCdchChecklistId(attr.type)"
                    @change="segmentosCompletos"
                  />

                  <CheckListComunicacionRadialDmh
                    v-else-if="isSpotComunicacionRadialCodelcoType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListAmsaBase
                    v-else-if="isSpotCodelcoType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    :checklist-id="getSpotCodelcoChecklistId(attr.type)"
                    @change="segmentosCompletos"
                  />

                  <CheckListComunicacionRadial
                    v-else-if="isComunicacionRadialType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListArnesRespirador
                    v-else-if="['checkListArnesRespirador', 'checklistArnesRespirador', 'CHECK LIST ARNES RESPIRADOR', 'CHECK LIST ARNÉS RESPIRADOR'].includes(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListArnesSeguridadDmh
                    v-else-if="isArnesSeguridadDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListElementosIzajeDmh
                    v-else-if="isElementosIzajeDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <AtsBloquesToggle
                    v-else-if="['atsToggles', 'atsBloquesToggle', 'ATS BLOQUES TOGGLE'].includes(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <TareaAts
                    v-else-if="['tarea', 'tareaAts', 'TAREA ATS'].includes(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CondicionesSeguridadTrabajo
                    v-else-if="isCondicionesSeguridadType(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    :usuarios="nombresUsuariosById"
                    :isSuperiorMode="isSuperiorModeForAttr(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckExtintores
                    v-else-if="attr.type === 'checkExtintores'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckListExtintorCdch
                    v-else-if="['checkListExtintorCdch', 'checklistExtintorCdch', 'CHECK LIST EXTINTOR CDCH', 'CHECK LIST EXTINTOR', 'checkListGrilleteCdch', 'checklistGrilleteCdch', 'CHECK LIST GRILLETE CDCH', 'CHECK LIST GRILLETE', 'checkListRetractilCdch', 'checklistRetractilCdch', 'CHECK LIST RETRACTIL CDCH', 'CHECK LIST RETRACTIL'].includes(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListEslingasTubulares
                    v-else-if="['checkListEslingasTubularesCdch', 'checklistEslingasTubularesCdch', 'CHECK LIST ESLINGAS TUBULARES CDCH', 'CHECK LIST ESLINGAS TUBULARES'].includes(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListControlViento
                    v-else-if="['checkListControlVientoCdch', 'checklistControlVientoCdch', 'CHECK LIST CONTROL DE VIENTO CDCH', 'CHECK LIST CONTROL DE VIENTO'].includes(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListVerificacionSuelo
                    v-else-if="['checkListVerificacionSueloCdch', 'checklistVerificacionSueloCdch', 'CHECK LIST VERIFICACION DEL SUELO CDCH', 'CHECK LIST VERIFICACION DEL SUELO'].includes(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListAccesoriosAmarre
                    v-else-if="['checkListAccesoriosAmarreCdch', 'checklistAccesoriosAmarreCdch', 'CHECK LIST ACCESORIOS DE AMARRE CDCH', 'CHECK LIST ACCESORIOS DE AMARRE'].includes(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamaBaja
                    v-else-if="isCamaBajaCdchType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamioneta
                    v-else-if="isCamionetaCdchType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamionetaDmh
                    v-else-if="isCamionetaDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamionRamplaDmh
                    v-else-if="isCamionRamplaDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListGruaHorquillaDmh
                    v-else-if="isGruaHorquillaDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamionGruaDmh
                    v-else-if="isCamionGruaDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListCamionPlumaDmh
                    v-else-if="isCamionPlumaDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckListAlzaHombreDmh
                    v-else-if="isAlzaHombreDmhType(attr.type)"
                    :attr="attr"
                    :disabled="isSurveyReadOnly"
                    @change="segmentosCompletos"
                  />

                  <CheckEpp
                    v-else-if="['checkEpp', 'checkEPP', 'inspeccionEpp', 'inspeccionEPP'].includes(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <CheckBanosInstalaciones
                    v-else-if="['checkBanosInstalaciones', 'checkBanos', 'CHECK BANOS INSTALACIONES'].includes(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <ListaInspeccionCamion
                    v-else-if="['listaInspeccionCamion', 'LISTA INSPECCION CAMION'].includes(attr.type)"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    @change="segmentosCompletos"
                  />

                  <ObservacionConductual
                    v-else-if="attr.type === 'checkListObservacionConductual'"
                    :attr="attr"
                    :disabled="!puedeEditar(attr)"
                    :usuarios="nombresUsuariosById"
                    :isSuperiorMode="isSuperiorModeForAttr(attr)"
                    @change="segmentosCompletos"
                  />

                  <VerDoc v-else-if="attr.type === 'verDoc'" :attr="attr" />




                  <div v-else>
                    <em>Tipo {{ attr.type }} no implementado</em>
                    <em>{{ attr }}</em>
                  </div>
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- ================= PPD: solo visual, acordeones cerrados ================= -->
        <v-expansion-panels multiple v-else>
          <v-expansion-panel v-for="(grupo, gIdx) in getCuadrillasPPD(survey)" :key="'ppd-cuadrilla-' + gIdx"
            class="mb-4">
            <v-expansion-panel-title>
              <div class="d-flex flex-column w-100">
                <div class="d-flex align-center justify-space-between">
                  <span class="font-weight-medium">
                    Cuadrilla: {{ grupo.cuadrilla }}
                  </span>
                  <div class="d-flex align-center" style="gap: 8px;">
                    <v-chip size="x-small" label>
                      {{ grupo.partidas }} partidas
                    </v-chip>
                    <v-chip size="x-small" label>
                      {{ grupo.totalHoras }} hrs
                    </v-chip>
                  </div>
                </div>
              </div>
            </v-expansion-panel-title>

            <v-expansion-panel-text>
              <!-- Acordeones por partida -->
              <v-expansion-panels multiple>
                <v-expansion-panel v-for="(tarea, tIdx) in grupo.tareas" :key="'ppd-tarea-' + tIdx" class="mb-2">
                  <v-expansion-panel-title>
                    <div class="d-flex flex-column w-100">
                      <span class="font-weight-medium">
                        {{ tarea.partida }}
                      </span>
                      <span class="text-caption">
                        Plan: {{ tarea.plan ?? '—' }} {{ tarea.unidad || '' }}
                        · Real: {{ tarea.real ?? '—' }} {{ tarea.unidad || '' }}
                      </span>
                    </div>
                  </v-expansion-panel-title>

                  <v-expansion-panel-text>
                    <v-row dense class="text-body-2">
                      <v-col cols="6">
                        <strong>Planificado</strong><br />
                        {{ tarea.plan ?? '—' }} {{ tarea.unidad || '' }}
                      </v-col>
                      <v-col cols="6">
                        <strong>Avance Real</strong><br />
                        {{ tarea.real ?? '—' }} {{ tarea.unidad || '' }}
                      </v-col>

                      <v-col cols="12" class="mt-2">
                        <strong>Motivo de No Cumplimiento</strong><br />
                        {{ tarea.motivo || '—' }}
                      </v-col>

                      <v-col cols="12" class="mt-2">
                        <strong>Observaciones</strong><br />
                        {{ tarea.observaciones || '—' }}
                      </v-col>

                      <!-- Fotos -->
                      <v-col v-if="(tarea.fotos || []).length" cols="12" class="mt-2">
                        <strong>Fotos</strong><br />
                        <div class="d-flex flex-row flex-wrap" style="gap: 8px;">
                          <v-img v-for="(foto, fIdx) in tarea.fotos" :key="'foto-' + fIdx"
                            :src="foto.url || foto.base64 || foto.src" width="110" height="80" cover
                            class="rounded-lg" />
                        </div>
                      </v-col>

                      <!-- Horas asignadas -->
                      <v-col v-if="(tarea.assigned_personnel || []).length" cols="12" class="mt-2">
                        <strong>Horas Asignadas</strong>
                        <v-list density="compact">
                          <v-list-item v-for="(p, pIdx) in tarea.assigned_personnel" :key="'pers-' + pIdx">
                            <v-list-item-title>
                              {{ p.nombre || '—' }}
                            </v-list-item-title>
                            <v-list-item-subtitle>
                              {{ p.horas ?? '—' }} hrs
                            </v-list-item-subtitle>
                          </v-list-item>
                        </v-list>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- DIALOG: usa tu JSON attr.dialog -->
        <v-dialog v-model="dialogAgregar.open" max-width="520">
          <v-card>
            <v-card-title class="text-h6">
              {{ dialogAgregar.title }}
            </v-card-title>

            <v-card-text>
              <v-row dense>
                <v-col cols="12" v-for="(input, iIdx) in dialogAgregar.inputs" :key="'dlg-inp-' + iIdx">
                  <v-text-field :label="input.label" v-model="input.value" density="compact" variant="underlined"
                    hide-details @keyup.enter="confirmAgregarFila" />
                </v-col>
              </v-row>
            </v-card-text>

            <v-card-actions class="justify-end">
              <v-btn variant="text" @click="cancelAgregarFila">Cancelar</v-btn>
              <v-btn color="primary" @click="confirmAgregarFila">Aceptar</v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>

        <v-btn v-if="!isGuardarFlotanteConexion" :disabled="isSurveyReadOnly" color="primary" style="box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);" size="large" class="w-100 inspeccion-action-btn"
          @click="guardarSurvey">
          <v-icon left>mdi-content-save</v-icon>
          Guardar
        </v-btn>


      </v-col>
      <v-col>
        <!-- ✅ BOTÓN SUPERIOR (cierre superior) -->
        <v-btn v-if="isSuperiorModeActive" color="deep-purple-accent-4" style="box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);" size="large" class="w-100 inspeccion-action-btn"
          @click="confirmarTerminarSurvey">
          <v-icon left>mdi-draw</v-icon>
          Terminar y Firmar Cierre
        </v-btn>

        <!-- ✅ BOTÓN FIRMA (solo template 101) -->
        <v-btn v-else-if="isTemplate101 && !isSurveyReadOnly" color="primary" style="box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);" size="large"
          class="w-100 inspeccion-action-btn" @click="confirmarTerminarSurvey">
          <v-icon left>mdi-draw</v-icon>
          Proceder a Firma
        </v-btn>

        <!-- ✅ BOTÓN NORMAL (todo lo demás) -->
        <v-btn v-else-if="!isConexionActual && !isSurveyReadOnly" color="primary" style="box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.3);" size="large" class="w-100 inspeccion-action-btn"
          @click="confirmarTerminarSurvey">
          <v-icon left>mdi-content-save</v-icon>
          Pasar a Flujo de Aprobación
        </v-btn>
      </v-col>
    </v-row>

    <v-btn
      v-if="isGuardarFlotanteConexion && !isSurveyReadOnly"
      color="primary"
      size="large"
      class="inspeccion-action-btn inspeccion-action-btn--floating"
      @click="guardarSurvey"
    >
      <v-icon left>mdi-content-save</v-icon>
      Guardar
    </v-btn>
  </v-container>
  <v-dialog v-model="dialogConfirmarTerminar" width="400">
    <v-card>
      <v-card-title class="text-h6">Confirmar</v-card-title>
      <v-card-text>
        ¿Estás seguro de que quieres terminar este survey? Esta acción no se puede deshacer.
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn text @click="dialogConfirmarTerminar = false">Cancelar</v-btn>
        <v-btn color="primary" @click="handleTerminarSurvey">Confirmar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <!-- Dialogo de carga con spinner -->
  <!--v-dialog v-model="dialogLoading" persistent width="300">
      <v-card>
        <v-card-text>
          <v-row align="center" justify="center">
            <v-progress-circular indeterminate size="60" />
            <span class="ml-3">Procesando...</span>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog-->
  <v-dialog v-model="dialogLoading" persistent width="300">
    <v-card color="primary" dark>
      <v-card-text class="text-center">
        <v-progress-circular indeterminate color="white" class="mb-4" />
        <div>Procesando...</div>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Dialogo de resultado -->
  <v-dialog v-model="dialogResultado" width="400">
    <v-card>
      <v-card-title class="text-h6">Protocolo / Inspección</v-card-title>
      <v-card-text>
        Protocolo / Inspección ingresa a Flujo de Aprobación.
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="primary" @click="handleResultadoAceptar">Aceptar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup>
import { useRoute, useRouter } from "vue-router";
import { reactive, ref, onMounted, watch, computed } from 'vue';
import apiAxios from '@/services/api'
import SignatureField from '@/components/SignatureField.vue'
import FotoCapture from '@/components/FotoCapture.vue'
import FotoCeck from '@/components/FotoCheck.vue'
import GeoLocation from "@/components/GeoLocation.vue";
import FileUpload from "@/components/FileUpload.vue";
import LeerQr from "@/components/LeerQr.vue";
import MatrizEditable from '@/components/MatrizEditable.vue'
import MatrizCombustible from '@/components/MatrizCombustible.vue'
import MatrizExcavaciones from "@/components/MatrizExcavaciones.vue";
import MatrizBorewrap from "@/components/MatrizBorewrap.vue";
import MatrizTransp from "@/components/MatrizTransp.vue";
import { DateTime } from 'luxon';
import { usePersistenciaStore } from '@/store/persistencia'
import { useSurveyDetailStore } from "@/store/surveyDetail";
import { useUserDetailStore } from "@/store/userDetail";
import MatrizGranallado from "@/components/MatrizGranallado.vue";
import MatrizProtal from "@/components/MatrizProtal.vue";
import MatrizCheck from '@/components/MatrizCheck.vue';
import ArtefactosCheck from '@/components/ArtefactosCheck.vue';
import MatrizPolypipe from '@/components/MatrizPolypipe.vue';
import MatrizSoldadura from '@/components/MatrizSoldadura.vue';
import AsignarEquipo from '@/components/AsignarEquipo.vue';
import { useFlujoAprobacion } from '@/composables/useFlujoAprobacion'
import { useOfflineInspecciones } from '@/composables/useOfflineInspecciones'
import VerDoc from '@/components/VerDoc.vue'
import EstructuraMultiple from '@/components/EstructuraMultiple.vue'
import RegistroEventos from '@/components/RegistroEventos.vue'
import MatrizMAObsyRecomenaciones from '@/components/MatrizMAObsyRecomenaciones.vue'
import CheckListTecles from '@/components/CheckListTecles.vue'
import IngresoZanja from '@/components/IngresoZanja.vue'
import ChequeoExtensionElectrica from '@/components/ChequeoExtensionElectrica.vue'
import CheckMonofasicoTrifasico from '@/components/CheckMonofasicoTrifasico.vue'
import Vibropison from '@/components/Vibropison.vue'
import ChequeoSeguridadBetonera from '@/components/ChequeoSeguridadBetonera.vue'
import CheckeoMartilloDemoledor from '@/components/CheckeoMartilloDemoledor.vue'
import CheckEquiposIluminacion from '@/components/CheckEquiposIluminacion.vue'
import CheckDispensadorAguaPotable from '@/components/CheckDispensadorAguaPotable.vue'
import CheckListHerramientasManuales from '@/components/CheckListHerramientasManuales.vue'
import CheckListComunicacionRadial from '@/components/CheckListComunicacionRadial.vue'
import CheckListComunicacionRadialDmh from '@/components/CheckListComunicacionRadialDmh.vue'
import CheckListConformidadSegregacionDmh from '@/components/CheckListConformidadSegregacionDmh.vue'
import CheckListInspeccionEprDmh from '@/components/CheckListInspeccionEprDmh.vue'
import CheckListEstabilidadSueloDmh from '@/components/CheckListEstabilidadSueloDmh.vue'
import CheckListAseoDesinfeccionDmh from '@/components/CheckListAseoDesinfeccionDmh.vue'
import CheckListControlNeumaticosDmh from '@/components/CheckListControlNeumaticosDmh.vue'
import CheckListElementosVisibilidadDmh from '@/components/CheckListElementosVisibilidadDmh.vue'
import CheckListCamionPlumaAmsa from '@/components/CheckListCamionPlumaAmsa.vue'
import CheckListCamionetaAmsa from '@/components/CheckListCamionetaAmsa.vue'
import CheckListGruaHorquillaAmsa from '@/components/CheckListGruaHorquillaAmsa.vue'
import CheckListGruaHorquillaPostUsoAmsa from '@/components/CheckListGruaHorquillaPostUsoAmsa.vue'
import CheckListGruaMovilAmsa from '@/components/CheckListGruaMovilAmsa.vue'
import CheckListCancamosAmsa from '@/components/CheckListCancamosAmsa.vue'
import CheckListEslingaCadenasAmsa from '@/components/CheckListEslingaCadenasAmsa.vue'
import CheckListEslingasPoliesterAmsa from '@/components/CheckListEslingasPoliesterAmsa.vue'
import CheckListEslingasTubularesAmsa from '@/components/CheckListEslingasTubularesAmsa.vue'
import CheckListEstrobosAceroAmsa from '@/components/CheckListEstrobosAceroAmsa.vue'
import CheckListFajasAmarreAmsa from '@/components/CheckListFajasAmarreAmsa.vue'
import CheckListGrilletesAmsa from '@/components/CheckListGrilletesAmsa.vue'
import CheckListArnesSeguridadAmsa from '@/components/CheckListArnesSeguridadAmsa.vue'
import CheckListCajaInviernoAmsa from '@/components/CheckListCajaInviernoAmsa.vue'
import CheckListEscalasPortatilesAmsa from '@/components/CheckListEscalasPortatilesAmsa.vue'
import CheckListInspeccionEppAmsa from '@/components/CheckListInspeccionEppAmsa.vue'
import CheckListExtintoresAmsa from '@/components/CheckListExtintoresAmsa.vue'
import CheckListControlLicenciasAmsa from '@/components/CheckListControlLicenciasAmsa.vue'
import CheckListCancamosPdfAmsa from '@/components/CheckListCancamosPdfAmsa.vue'
import CheckListEscalaTipoAvionAmsa from '@/components/CheckListEscalaTipoAvionAmsa.vue'
import CheckListAmsaBase from '@/components/CheckListAmsaBase.vue'
import CheckListArnesRespirador from '@/components/CheckListArnesRespirador.vue'
import CheckListArnesSeguridadDmh from '@/components/CheckListArnesSeguridadDmh.vue'
import CheckListElementosIzajeDmh from '@/components/CheckListElementosIzajeDmh.vue'
import ListaInspeccionCamion from '@/components/ListaInspeccionCamion.vue'
import AtsBloquesToggle from '@/components/AtsBloquesToggle.vue'
import TareaAts from '@/components/TareaAts.vue'
import CheckExtintores from '@/components/CheckExtintores.vue'
import CheckListExtintorCdch from '@/components/CheckListExtintorCdch.vue'
import CheckListEslingasTubulares from '@/components/CheckListEslingasTubulares.vue'
import CheckListControlViento from '@/components/CheckListControlViento.vue'
import CheckListVerificacionSuelo from '@/components/CheckListVerificacionSuelo.vue'
import CheckListAccesoriosAmarre from '@/components/CheckListAccesoriosAmarre.vue'
import CheckListCamaBaja from '@/components/CheckListCamaBaja.vue'
import CheckListCamioneta from '@/components/CheckListCamioneta.vue'
import CheckListCamionetaDmh from '@/components/CheckListCamionetaDmh.vue'
import CheckListCamionRamplaDmh from '@/components/CheckListCamionRamplaDmh.vue'
import CheckListGruaHorquillaDmh from '@/components/CheckListGruaHorquillaDmh.vue'
import CheckListCamionGruaDmh from '@/components/CheckListCamionGruaDmh.vue'
import CheckListCamionPlumaDmh from '@/components/CheckListCamionPlumaDmh.vue'
import CheckListAlzaHombreDmh from '@/components/CheckListAlzaHombreDmh.vue'
import CheckEpp from '@/components/CheckEpp.vue'
import CheckBanosInstalaciones from '@/components/CheckBanosInstalaciones.vue'
import CondicionesSeguridadTrabajo from '@/components/CondicionesSeguridadTrabajo.vue'
import ObservacionConductual from '@/components/ObservacionConductual.vue'
import { usePermisosAtributo } from '@/composables/usePermisosAtributo'

/* eslint-disable */

const { terminarSurveyYExportar } = useFlujoAprobacion()
const { puedeEditar: originalPuedeEditar, cargarRoles } = usePermisosAtributo()

const isSuperiorModeActive = computed(() => {
  const current = surveyDetailStore.surveyDetail?.[0]
  if (!current) return false
  const statusSrv = String(current.estado_srv || '').trim().toUpperCase()
  if (statusSrv !== 'VERIFICACION') return false

  const bodyExec = typeof current.body_exec === 'string' ? JSON.parse(current.body_exec) : (current.body_exec || {})
  const segmentos = Array.isArray(bodyExec.segmentos) ? bodyExec.segmentos : []
  
  let superiorId = null
  for (const s of segmentos) {
    const attrs = Array.isArray(s.attributes) ? s.attributes : []
    for (const a of attrs) {
      if (a.type === 'checkListObservacionConductual') {
        superiorId = a.datos?.superiorDerivado
      } else if (a.type === 'condicionesSeguridadTrabajo') {
        superiorId = a.superiorDerivado
      }
      if (superiorId) break
    }
    if (superiorId) break
  }

  if (!superiorId) return false
  const currentUserId = userDetailStore.userDetail?.id_user
  return Number(superiorId) === Number(currentUserId)
})

const isSurveyReadOnly = computed(() => {
  const current = surveyDetailStore.surveyDetail?.[0]
  if (!current) return false
  const statusSrv = String(current.estado_srv || '').trim().toUpperCase()
  
  if (['TERMINADO', 'APROBADO'].includes(statusSrv)) return true
  
  if (statusSrv === 'VERIFICACION') {
    // Si el usuario es el superior derivado en esta encuesta, no es de sólo lectura absoluto
    // ya que debe poder editar el bloque de cierre y presionar "Terminar" para firmar.
    if (isSuperiorModeActive.value) return false
    return true
  }
  
  return false
})

function puedeEditar(attr) {
  const current = surveyDetailStore.surveyDetail?.[0]
  const statusSrv = String(current?.estado_srv || '').trim().toUpperCase()
  
  if (statusSrv === 'VERIFICACION') {
    if (isSuperiorModeActive.value && isSuperiorModeForAttr(attr)) {
      return true
    }
    return false
  }

  if (isSurveyReadOnly.value) {
    return false
  }
  return originalPuedeEditar(attr)
}

const userDetailStore = useUserDetailStore()

const persistencia = usePersistenciaStore()
const surveyDetailStore = useSurveyDetailStore()

// 🔹 cola offline SOLO inspecciones
const {
  enviarOACola,
  sincronizarAhora,
  cola,
  sincronizando
} = useOfflineInspecciones()

const router = useRouter();
const route = useRoute();
const idSurvey = ref(null);
const show = ref(false);
const errores = ref({});
const surveyLoading = ref(false);
const loadedSurveyId = ref(null);
let inFlightSurveyRequest = null;

idSurvey.value = route.query.idInspeccion;

const surveys = ref(null);

const dialogConfirmarTerminar = ref(false);
const dialogLoading = ref(false);
const dialogResultado = ref(false);
const linkedParentDetail = ref(null)
const nombresUsuariosById = ref({})
const surveyHeaderSnapshot = ref(null)
const childEvidenciaByParent = ref({})

const rows = ref([
  { nro: 1, pk: '10', prof: 2, anchoSello: 1.2, anchoSup: 1.5, cotaSello: 'A' },
  { nro: 2, pk: '12', prof: 2.5, anchoSello: 1.3, anchoSup: 1.6, cotaSello: 'B' },
])

// Guarda el attr actual que abrió el diálogo para saber dónde agregar la fila
const currentAttrRef = ref(null)

// Estado del diálogo “Agregar fila”
const dialogAgregar = reactive({
  open: false,
  title: 'Agregar fila',
  inputs: []  // [{label:'', value:''}, ...]
})

// Default global si no viene cantiDec en el attr
const DEFAULT_DECIMALS = ref(2) // puedes cambiarlo a 3 o 4

function getDecimals(attr) {
  const n = Number(attr?.cantiDec ?? DEFAULT_DECIMALS.value)
  // limita para evitar cosas raras
  if (!Number.isFinite(n)) return DEFAULT_DECIMALS.value
  return Math.min(6, Math.max(0, n))
}

// step dinámico para input number/decimal (0.01 / 0.001 / 0.0001)
function decimalStep(attr) {
  const d = getDecimals(attr)
  return d <= 0 ? '1' : `0.${'0'.repeat(d - 1)}1`
}

// permite números, coma, punto, signo menos, navegación
function onlyDecimalKeypress(e) {
  const ch = e.key
  const ok =
    /[0-9.,-]/.test(ch) ||
    ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(ch)
  if (!ok) e.preventDefault()
}

// Convierte string con coma/punto a Number seguro
function parseDecimalSmart(val) {
  if (val === null || val === undefined) return null
  let s = String(val).trim()
  if (s === '') return null

  // Quita espacios
  s = s.replace(/\s+/g, '')

  // Deja solo dígitos, coma, punto y signo -
  s = s.replace(/[^\d,.\-]/g, '')

  // Si no hay separadores, parse normal
  const hasComma = s.includes(',')
  const hasDot = s.includes('.')
  if (!hasComma && !hasDot) {
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : null
  }

  // Tomamos el ÚLTIMO separador (coma o punto) como separador decimal
  const lastComma = s.lastIndexOf(',')
  const lastDot = s.lastIndexOf('.')
  const decPos = Math.max(lastComma, lastDot)

  const intPart = s.slice(0, decPos).replace(/[.,]/g, '')  // quita miles
  const decPart = s.slice(decPos + 1).replace(/[.,]/g, '') // por si viene basura

  const normalized = decPart.length ? `${intPart}.${decPart}` : intPart
  const n = parseFloat(normalized)
  return Number.isFinite(n) ? n : null
}

// Redondeo a N decimales
function roundTo(n, decimals) {
  const d = Number(decimals) || 0
  const factor = Math.pow(10, d)
  return Math.round(n * factor) / factor
}

// Normaliza el attr.default al perder foco (blur)
function normalizeDecimalAttr(attr) {
  const d = getDecimals(attr)
  const n = parseDecimalSmart(attr.default)

  if (n === null) {
    attr.default = ''
    return
  }

  const r = roundTo(n, d)

  // Si quieres que SIEMPRE muestre decimales (ej 12,30)
  // y no quede "12" sin decimales:
  attr.default = r.toFixed(d).replace('.', ',')  // <- queda string, pero visualmente perfecto
}

// Construye el estado del diálogo desde attr.dialog[0]
function makeDialogStateFromAttr(attr) {
  const dlg = (attr?.dialog && attr.dialog[0]) ? attr.dialog[0] : { title: 'Agregar fila', inputs: [] }
  return {
    title: dlg.title || 'Agregar fila',
    inputs: (dlg.inputs || []).map(inp => ({ label: inp.label ?? '', value: inp.value ?? '' }))
  }
}

function openAgregarFila(attr) {
  currentAttrRef.value = attr
  const fresh = makeDialogStateFromAttr(attr)
  dialogAgregar.title = fresh.title
  dialogAgregar.inputs = fresh.inputs
  dialogAgregar.open = true
}

function cancelAgregarFila() {
  dialogAgregar.open = false
  currentAttrRef.value = null
}

function confirmAgregarFila() {
  const attr = currentAttrRef.value
  if (!attr) { dialogAgregar.open = false; return }

  if (!Array.isArray(attr.body)) attr.body = []

  // Cada input -> una celda { value }
  const nuevaFila = dialogAgregar.inputs.map(inp => ({ value: inp.value }))
  attr.body.push(nuevaFila)

  dialogAgregar.open = false
  currentAttrRef.value = null

  // Recalcular al tiro
  recalcular(attr)
}
/*function confirmAgregarFila() {
  const attr = currentAttrRef.value;
  if (!attr) return;

  const cols = getMatrixColumnCount(attr);
  // Partimos los inputs en filas del tamaño de columnas de la matriz
  const filas = chunk(dialogAgregar.inputs, cols);

  // Transformamos a formato de body ([[{value},{value},...], ...])
  const newRows = filas.map(rowInputs =>
    rowInputs.map(inp => ({ value: (inp?.value ?? '') }))
  );

  if (attr.actualizar) {
    // REEMPLAZA COMPLETO
    attr.body = JSON.parse(JSON.stringify(newRows));
  } else {
    // AGREGA AL FINAL
    const curr = Array.isArray(attr.body) ? attr.body : [];
    attr.body = [...curr, ...JSON.parse(JSON.stringify(newRows))];
    recalcular(attr);
  }

  dialogAgregar.open = false;
}*/

// Clon seguro y simple
function deepClone(obj) {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

// Prepara un borrador editable con misma forma MxN
function ensureDraftForAttr(attr) {
  const body = Array.isArray(attr.body) ? attr.body : [];
  attr.__draftBody = body.map(row =>
    (Array.isArray(row) ? row : []).map(cell => ({
      ...(cell || {}),           // ← conserva type, editable, etc.
      value: cell?.value ?? ''
    }))
  );
  if (attr.__draftBody.length === 0) {
    attr.__draftBody = [[{ value: '', type: 'text', editable: true }]];
  }
}

function promedioDesdeBodyCol(attr, colIndex) {
  const rows = Array.isArray(attr?.body) ? attr.body : []
  const nums = rows
    .map(r => Number(r?.[colIndex]?.value ?? NaN))
    .filter(v => !Number.isNaN(v))
  if (!nums.length) return ''
  const avg = nums.reduce((s, n) => s + n, 0) / nums.length
  return Number.isFinite(avg) ? Number(avg.toFixed(2)) : ''
}

function recalcular(attr) {
  const footer = Array.isArray(attr?.footer) ? attr.footer : []
  for (const row of footer) {
    const promCells = row.filter(c => c?.cal === 'prom')
    if (promCells.length >= 1) {
      // Layout: 0:N°, 1:PK, 2:a, 3:b, 4:c, 5:cota
      if (promCells[0]) promCells[0].value = promedioDesdeBodyCol(attr, 2) // a
      if (promCells[1]) promCells[1].value = promedioDesdeBodyCol(attr, 3) // b
      if (promCells[2]) promCells[2].value = promedioDesdeBodyCol(attr, 4) // c
      if (promCells[3]) promCells[3].value = promedioDesdeBodyCol(attr, 5) // cota
      break
    }
  }
}




const eliminarFila = (index) => {
  rows.value.splice(index, 1)
  actualizarNumeros()
}

const agregarFila = () => {
  rows.value.push({
    nro: rows.value.length + 1,
    pk: '',
    prof: '',
    anchoSello: '',
    anchoSup: '',
    cotaSello: ''
  })
}

const actualizarNumeros = () => {
  rows.value.forEach((fila, index) => {
    fila.nro = index + 1
  })
}

function acceptInlineUpdate(attr) {
  attr.body = deepClone(attr.__draftBody);
  attr.__editing = false;
  delete attr.__draftBody;
  recomputeAndPersistMCheck(attr); // <-- persiste al guardar
}

onMounted(async () => {
  if (!idSurvey.value) {
    console.error('idInspeccion no informado en la ruta');
    return;
  }
  try {
    const raw = sessionStorage.getItem(`cnx_header_${String(idSurvey.value)}`)
    surveyHeaderSnapshot.value = raw ? JSON.parse(raw) : null
  } catch {
    surveyHeaderSnapshot.value = null
  }
  await getSurvey();
  await Promise.allSettled([
    cargarNombresUsuarios(),
    cargarDetalleRelacionadoConexion()
  ])
  await sincronizarConexionTemplate110DesdeHijoAlAbrir()
  cargarRoles() // Carga roles para permisos
  // Inicializa métricas para todas las matrices check que existan
  surveyDetailStore.surveyDetail.forEach(srv => {
    const segs = getSegmentos(srv);
    segs.forEach(seg => (seg.attributes || [])
      .filter(a => a.type === 'matrizCheck')
      .forEach(a => recomputeAndPersistMCheck(a)));
  });
  segmentosCompletos();
});

// Si el diálogo de resultado se cierra de cualquier forma, navega igual
watch(dialogResultado, (newVal) => {
  if (!newVal) {
    router.push({ path: '/surveys' });
  }
});

async function getSurvey() {
  const sid = String(idSurvey.value ?? '').trim();
  if (!sid) return;

  if (loadedSurveyId.value === sid && Array.isArray(surveys.value) && surveys.value.length) {
    return;
  }

  if (inFlightSurveyRequest && inFlightSurveyRequest.sid === sid) {
    await inFlightSurveyRequest.promise;
    return;
  }

  if (surveyLoading.value) return;
  surveyLoading.value = true;

  try {
    const reqPromise = apiAxios.get("/servicio/leanglobal/procesosSurveyDetail?id_survey=" + sid);
    inFlightSurveyRequest = { sid, promise: reqPromise };
    const response = await reqPromise;
    const detail = Array.isArray(response.data) ? response.data : [];
    detail.forEach((survey) => normalizeSurveyBodyExecFromDb(survey));
    surveys.value = detail;
    surveyDetailStore.surveyDetail = detail;
    loadedSurveyId.value = sid;
  } catch (error) {
    console.error("Error al obtener survey:", error);
    throw error;
  } finally {
    surveyLoading.value = false;
    if (inFlightSurveyRequest?.sid === sid) inFlightSurveyRequest = null;
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
    const body = normalizeBodyExecContainer(survey.body_exec);

    survey.body_exec = body;

    let segmentos = body.segmentos;

    /*if (!segmentos.some(isArnesRespiradorSegment)) {
      segmentos.push(createArnesRespiradorSegment())
    }

    if (!segmentos.some(isExtintorCdchSegment)) {
      segmentos.push(createExtintorCdchSegment())
    }

    if (!segmentos.some(isGrilleteCdchSegment)) {
      segmentos.push(createGrilleteCdchSegment())
    }

    if (!segmentos.some(isRetractilCdchSegment)) {
      segmentos.push(createRetractilCdchSegment())
    }

    if (!segmentos.some(isEslingasTubularesCdchSegment)) {
      segmentos.push(createEslingasTubularesCdchSegment())
    }

    if (!segmentos.some(isControlVientoCdchSegment)) {
      segmentos.push(createControlVientoCdchSegment())
    }

    if (!segmentos.some(isVerificacionSueloCdchSegment)) {
      segmentos.push(createVerificacionSueloCdchSegment())
    }

    if (!segmentos.some(isAccesoriosAmarreCdchSegment)) {
      segmentos.push(createAccesoriosAmarreCdchSegment())
    }*/
    /***
    if (!segmentos.some(isArnesSeguridadDmhSegment)) {
      segmentos.push(createArnesSeguridadDmhSegment())
    }

    if (!segmentos.some(isElementosIzajeDmhSegment)) {
      segmentos.push(createElementosIzajeDmhSegment())
    }

    if (!segmentos.some(isComunicacionRadialDmhSegment)) {
      segmentos.push(createComunicacionRadialDmhSegment())
    }

    if (!segmentos.some(isConformidadSegregacionDmhSegment)) {
      segmentos.push(createConformidadSegregacionDmhSegment())
    }

    if (!segmentos.some(isInspeccionEprDmhSegment)) {
      segmentos.push(createInspeccionEprDmhSegment())
    }

    if (!segmentos.some(isEstabilidadSueloDmhSegment)) {
      segmentos.push(createEstabilidadSueloDmhSegment())
    }

    if (!segmentos.some(isAseoDesinfeccionDmhSegment)) {
      segmentos.push(createAseoDesinfeccionDmhSegment())
    }

    if (!segmentos.some(isControlNeumaticosDmhSegment)) {
      segmentos.push(createControlNeumaticosDmhSegment())
    }

    if (!segmentos.some(isElementosVisibilidadDmhSegment)) {
      segmentos.push(createElementosVisibilidadDmhSegment())
    }

    if (!segmentos.some(isCamionPlumaAmsaSegment)) {
      segmentos.push(createCamionPlumaAmsaSegment())
    }

    if (!segmentos.some(isCamaBajaCdchSegment)) {
      segmentos.push(createCamaBajaCdchSegment())
    }

    if (!segmentos.some(isCamionetaCdchSegment)) {
      segmentos.push(createCamionetaCdchSegment())
    }

    if (!segmentos.some(isCamionetaDmhSegment)) {
      segmentos.push(createCamionetaDmhSegment())
    }

    if (!segmentos.some(isCamionRamplaDmhSegment)) {
      segmentos.push(createCamionRamplaDmhSegment())
    }

    if (!segmentos.some(isGruaHorquillaDmhSegment)) {
      segmentos.push(createGruaHorquillaDmhSegment())
    }

    if (!segmentos.some(isCamionGruaDmhSegment)) {
      segmentos.push(createCamionGruaDmhSegment())
    }

    if (!segmentos.some(isCamionPlumaDmhSegment)) {
      segmentos.push(createCamionPlumaDmhSegment())
    }

        if (!segmentos.some(isAlzaHombreDmhSegment)) {
      segmentos.push(createAlzaHombreDmhSegment())
    }
    ***/

    /*if (!segmentos.some(isCamionPlumaAmsaSegment)) {
      segmentos.push(createCamionPlumaAmsaSegment())
    }

    if (!segmentos.some(isCamionetaAmsaSegment)) {
      segmentos.push(createCamionetaAmsaSegment())
    }

    AMSA_GENERATED_SEGMENTS.forEach((def) => {
      if (!segmentos.some((segmento) => isAmsaSegment(segmento, def))) {
        segmentos.push(createAmsaSegment(def))
      }
    })*/

    //agregarSegmentosTransmacPrueba(segmentos)

    /*SPOT_CODELCO_GENERATED_SEGMENTS.forEach((def) => {
      if (!segmentos.some((segmento) => isSpotCodelcoSegment(segmento, def))) {
        segmentos.push(createSpotCodelcoSegment(def))
      }
    })*/

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

function isConexionEstadoSelect(attr, survey) {
  if (!isConexionSurvey(survey)) return false;
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
    ? options.map(opt => {
      if (typeof opt === 'string' || typeof opt === 'number') {
        return { id: opt, label: String(opt), value: opt };
      }
      const val = opt?.value ?? opt?.id ?? opt?.label ?? opt?.text ?? '';
      const lbl = opt?.label ?? opt?.title ?? opt?.text ?? opt?.name ?? opt?.value ?? opt?.id ?? '';
      const idVal = opt?.id ?? opt?.value ?? lbl;
      return {
        id: idVal,
        label: String(lbl),
        value: val
      };
    })
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
  if (!isConexionSurvey(survey)) return String(survey?.estado_srv || 'Ejecución');

  const selectedEstado = getConexionEstadoSeleccionado(survey);
  if (selectedEstado) return selectedEstado;

  return String(survey?.estado_srv || 'Ejecución');
}

function normalizarEtiqueta(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getOrdenAsignacionActual(survey) {
  const data = getConexionHeaderData(survey)
  return String(data?.orden || '').trim()
}

function integrarOrdenEnBodyExecParaReclamo(bodyExec, ordenAsignacion) {
  if (!bodyExec || typeof bodyExec !== 'object') return
  const orden = String(ordenAsignacion || '').trim()
  if (!orden || orden === '-') return

  let foundOrdenField = null
  let segmentoReclamos = null

  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    const labelNode = normalizarEtiqueta(node?.label)
    if (!segmentoReclamos && (labelNode === 'reclamos (con survey)' || labelNode === 'reclamos con survey')) {
      segmentoReclamos = node
    }

    if (
      node?.type === 'textField' &&
      normalizarEtiqueta(node?.label) === 'orden'
    ) {
      foundOrdenField = node
    }

    Object.values(node).forEach(walk)
  }

  walk(bodyExec)

  const asignarValorOrden = (attr) => {
    if (!attr || typeof attr !== 'object') return
    attr.value = orden
    if (Object.prototype.hasOwnProperty.call(attr, 'default')) attr.default = orden
    if (Object.prototype.hasOwnProperty.call(attr, 'answer')) attr.answer = orden
    if (attr.values && typeof attr.values === 'object' && Object.prototype.hasOwnProperty.call(attr.values, 'selected')) {
      attr.values.selected = orden
    }
  }

  if (foundOrdenField) {
    asignarValorOrden(foundOrdenField)
    return
  }

  // Si no existe el campo, lo agrega en el segmento de reclamos.
  const attrs = Array.isArray(segmentoReclamos?.attributes) ? segmentoReclamos.attributes : null
  if (!attrs) return
  attrs.unshift({
    type: 'textField',
    label: 'Orden',
    value: orden,
    default: orden,
    answer: orden
  })
}

// 2) MODIFICADO: validar antes de guardar
const guardarSurvey = async () => {
  // si faltan fotos obligatorias, no continúa
  if (!validarFotosRequeridas()) return;

  // Si es modo superior activo, inyectar el gpsCierre de forma automática
  if (isSuperiorModeActive.value) {
    await obtenerUbicacion()
    surveyDetailStore.surveyDetail.forEach(survey => {
      const segmentos = getSegmentos(survey)
      ;(segmentos || []).forEach(seg => {
        ;(seg.attributes || []).forEach(attr => {
          if (attr.type === 'checkListObservacionConductual') {
            if (!attr.datos) attr.datos = {}
            attr.datos.gpsCierre = {
              lat: local.value.lat || null,
              lng: local.value.lng || null
            }
          } else if (attr.type === 'condicionesSeguridadTrabajo') {
            attr.gpsCierre = {
              lat: local.value.lat || null,
              lng: local.value.lng || null
            }
          }
        })
      })
    })
  }

  const id = surveyDetailStore.surveyDetail[0].id_survey
  const result = await putSurvey(id)

  if (!result || result.ok === false) {
    alert('Error al guardar el survey. Intenta nuevamente.')
    return
  }

  if (result.offlineQueued) {
    alert('Protocolo guardado OFFLINE. Se sincronizará automáticamente cuando vuelvas a tener conexión.')
  } else {
    alert('Protocolo guardado correctamente.')
  }

  console.log(surveyDetailStore.surveyDetail)
}

function normalizeBodyExec(bodyExec) {
  return JSON.stringify(normalizeBodyExecContainer(bodyExec))
}

const getSegmentosVisibles = (survey) => {
  return (getSegmentos(survey) || []).filter((seg) => {
    const label = String(seg?.label || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toUpperCase()
    return label !== 'DATOS CARGA'
  })
}

function extractSurveyDetail(payload) {
  if (!payload) return null
  if (Array.isArray(payload)) return payload[0] || null
  if (Array.isArray(payload?.data)) return payload.data[0] || null
  if (Array.isArray(payload?.datos)) return payload.datos[0] || null
  if (Array.isArray(payload?.surveyDetail)) return payload.surveyDetail[0] || null
  if (payload?.data && typeof payload.data === 'object') return payload.data
  return (typeof payload === 'object') ? payload : null
}

async function cargarDetalleRelacionadoConexion() {
  linkedParentDetail.value = null
  const survey = surveyDetailStore.surveyDetail?.[0]
  if (!survey || !isConexionSurvey(survey)) return

  const parentId = await obtenerParentIdSurvey(survey, survey.id_survey)
  if (!parentId) return

  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/procesosSurveyDetail', {
      params: { id_survey: parentId }
    })
    linkedParentDetail.value = extractSurveyDetail(data)
    conexionHeaderDataCache.clear()
  } catch (error) {
    console.warn('[Inspeccion] No se pudo cargar detalle padre de conexión:', error?.response?.data || error?.message)
  }
}

function getSystemFieldValue(attr, survey) {
  if (attr && attr.default && String(attr.default).trim() !== '') return attr.default;
  const label = normalizeSegmentLabel(attr?.label || attr?.text || '');
  if (label.includes('direccion')) {
    return survey?.direccion_obra || survey?.observacion_proyecto || survey?.direccion || surveyDetailStore?.surveyDetail?.[0]?.direccion_obra || surveyDetailStore?.surveyDetail?.[0]?.observacion_proyecto || '';
  }
  if (label.includes('nombre') && label.includes('obra')) {
    return survey?.nombre_proyecto || survey?.name_proyecto || surveyDetailStore?.surveyDetail?.[0]?.nombre_proyecto || '';
  }
  return attr?.default || '';
}

function normalizeSurveyBodyExecFromDb(survey) {
  if (!survey || typeof survey !== 'object') return

  const bodyExec = normalizeBodyExecContainer(survey.body_exec)
  dedupeComunicacionRadialSegmentos(bodyExec.segmentos)

  // 1. Limpieza y sincronización de Segmentos para Template 80
  if (Array.isArray(bodyExec.segmentos)) {
    bodyExec.segmentos.forEach(seg => {
      if (Array.isArray(seg.attributes)) {
        // Eliminar REFERENCIA DE LA DIRECCION
        seg.attributes = seg.attributes.filter(attr => {
          const label = normalizeSegmentLabel(attr.label || attr.text || '')
          return !(label.includes('referencia') && label.includes('direccion'))
        })

        // Sincronizar DIRECCION DE LA OBRA si viene vacía
        seg.attributes.forEach(attr => {
          const label = normalizeSegmentLabel(attr.label || attr.text || '')
          if (label.includes('direccion') && (!attr.default || attr.default === '')) {
            const dirFallback = survey.direccion_obra || survey.observacion_proyecto || survey.direccion || survey.nombre_proyecto || ''
            if (dirFallback) attr.default = dirFallback
          }
          if (attr.type === 'geoLocation') {
            if (attr.default?.geoVisita && !attr.geoVisita) {
              attr.geoVisita = attr.default.geoVisita
            }
          }
        })
      }
    })
  }

  survey.body_exec = bodyExec
}

function normalizeBodyExecContainer(rawBodyExec) {
  let bodyExec = rawBodyExec
  if (typeof bodyExec === 'string') {
    const text = bodyExec.trim()
    if (text && text.toLowerCase() !== 'null') {
      try {
        bodyExec = JSON.parse(text)
      } catch (error) {
        console.error('Error parseando body_exec string:', error)
        bodyExec = {}
      }
    } else {
      bodyExec = {}
    }
  }

  if (Array.isArray(bodyExec)) {
    const looksLikeSegmentos = bodyExec.length === 0 || bodyExec.some((item) =>
      item && typeof item === 'object' && (
        Array.isArray(item.attributes) ||
        Object.prototype.hasOwnProperty.call(item, 'touch') ||
        Object.prototype.hasOwnProperty.call(item, 'collapsible') ||
        Object.prototype.hasOwnProperty.call(item, 'posicion')
      )
    )

    return looksLikeSegmentos
      ? { segmentos: bodyExec }
      : { task: bodyExec, segmentos: [] }
  }

  if (!bodyExec || typeof bodyExec !== 'object') bodyExec = {}
  if (!Array.isArray(bodyExec.segmentos)) bodyExec.segmentos = []
  return bodyExec
}

function normalizeDateForInput(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''

  let match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return raw

  match = raw.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  }

  return ''
}

function todayIsoDate() {
  return DateTime.now().setZone('America/Santiago').toFormat('yyyy-LL-dd')
}

function createComunicacionRadialSegment() {
  return {
    "label": "CHECK LIST COMUNICACIÓN RADIAL",
    "touch": false,
    "collapsible": false,
    "posicion": 1,
    "attributes": [
      {
        "type": "checkListComunicacionRadial",
        "label": "Comunicación Radial",
        "nullable": false,
        "fechaInicio": "",
        "body": []
      }
    ]
  }
}

function isComunicacionRadialType(type) {
  return [
    'checklistcomunicacionradial',
    'check list comunicacion radial',
    'check list comunicación radial'
  ].includes(normalizeText(type).replace(/\s+/g, ' '))
}

function createComunicacionRadialDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-012 CHECK LIST DE COMUNICACIÓN RADIAL",
    "touch": false,
    "collapsible": false,
    "posicion": 12,
    "attributes": [
      {
        "type": "checkListComunicacionRadialDmh",
        "label": "Check List Comunicación Radial DMH",
        "nullable": false,
        "datos": {
          "trabajadorInspecciona": "",
          "especialidad": "",
          "tipoRadio": "",
          "marcaModelo": "",
          "firmaTrabajador": ""
        },
        "fechaInicio": "",
        "fechaTermino": "",
        "codificacionColores": null,
        "body": []
      }
    ]
  }
}

function isComunicacionRadialDmhType(type) {
  return [
    'checklistcomunicacionradialdmh',
    'check list comunicacion radial dmh',
    'check list comunicación radial dmh',
    'for sgi cdmh 01 sst 012 check list de comunicacion radial',
    'for sgi cdmh 01 sst 012 check list de comunicación radial',
    'for sgi cdmh 01 sst 012',
    'for-sgi-cdmh-01-sst-012'
  ].includes(normalizeText(type).replace(/\s+/g, ' '))
}

function isSpotComunicacionRadialCodelcoType(type) {
  return normalizeText(type).replace(/\s+/g, ' ') === 'checklistspotcomunicacionradialcodelco'
}

function createConformidadSegregacionDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-020 CHECK LIST DE CONFORMIDAD DE LA SEGREGACION",
    "touch": false,
    "collapsible": false,
    "posicion": 13,
    "attributes": [
      {
        "type": "checkListConformidadSegregacionDmh",
        "label": "Check List Conformidad de la Segregacion DMH",
        "nullable": false,
        "actividades": []
      }
    ]
  }
}

function isConformidadSegregacionDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistconformidadsegregaciondmh',
    'check list conformidad segregacion dmh',
    'check list de conformidad de la segregacion',
    'for sgi cdmh 01 sst 020 check list de conformidad de la segregacion',
    'for sgi cdmh 01 sst 020 check list de conformidad de la segregación',
    'for-sgi-cdmh-01-sst-020-check-list-de-conformidad-de-la-segregacion'
  ].includes(key)
}

function isConformidadSegregacionDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-020 CHECK LIST DE CONFORMIDAD DE LA SEGREGACION') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-020 CHECK LIST DE CONFORMIDAD DE LA SEGREGACIÓN') ||
    attrs.some((attr) => isConformidadSegregacionDmhType(attr?.type))
}

function hasConformidadSegregacionDmhData(attr) {
  const actividades = Array.isArray(attr?.actividades) ? attr.actividades : []
  return actividades.some((actividad) => {
    const hasHeader = String(actividad?.nombreActividad ?? '').trim() !== '' ||
      String(actividad?.fecha ?? '').trim() !== ''
    const hasAnswers = Object.values(actividad?.respuestas || {})
      .some((value) => ['si', 'no'].includes(String(value ?? '').trim().toLowerCase()))
    const hasObs = String(actividad?.observacion ?? '').trim() !== ''
    return hasHeader || hasAnswers || hasObs
  })
}

function createInspeccionEprDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-021 INSPECCIÓN EPR",
    "touch": false,
    "collapsible": false,
    "posicion": 14,
    "attributes": [
      {
        "type": "checkListInspeccionEprDmh",
        "label": "Inspeccion EPR DMH",
        "nullable": false,
        "datos": {
          "nombreTrabajador": "",
          "rut": "",
          "cargo": ""
        },
        "inspecciones": [],
        "observaciones": ""
      }
    ]
  }
}

function isInspeccionEprDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistinspeccioneprdmh',
    'check list inspeccion epr dmh',
    'inspeccion epr dmh',
    'inspeccion epr',
    'inspección epr',
    'for sgi cdmh 01 sst 021 inspeccion epr',
    'for sgi cdmh 01 sst 021 inspección epr',
    'for-sgi-cdmh-01-sst-021-inspeccion-epr'
  ].includes(key)
}

function isInspeccionEprDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-021 INSPECCIÓN EPR') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-021 INSPECCION EPR') ||
    attrs.some((attr) => isInspeccionEprDmhType(attr?.type))
}

function hasInspeccionEprDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const hasObs = String(attr?.observaciones ?? '').trim() !== ''
  const hasAnswers = (Array.isArray(attr?.inspecciones) ? attr.inspecciones : []).some((inspeccion) =>
    (Array.isArray(inspeccion?.grupos) ? inspeccion.grupos : []).some((group) =>
      (Array.isArray(group?.items) ? group.items : []).some((item) =>
        ['si', 'no', 'na', 'n/a'].includes(String(item?.respuesta ?? '').trim().toLowerCase())
      )
    )
  )
  return hasDatos || hasObs || hasAnswers
}

function createEstabilidadSueloDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-022 FORMATO VERIFICACION DE ESTABILIDAD DEL SUELO",
    "touch": false,
    "collapsible": false,
    "posicion": 15,
    "attributes": [
      {
        "type": "checkListEstabilidadSueloDmh",
        "label": "Verificacion de Estabilidad del Suelo DMH",
        "nullable": false,
        "datos": {
          "tarea": "",
          "modeloGrua": "",
          "sectorUbicacion": "",
          "operadorGrua": "",
          "supervisor": "",
          "rigger": ""
        },
        "items": [],
        "resultadoFinal": {
          "resultado": "",
          "observaciones": ""
        }
      }
    ]
  }
}

function isEstabilidadSueloDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistestabilidadsuelodmh',
    'check list estabilidad suelo dmh',
    'verificacion de estabilidad del suelo dmh',
    'formato verificacion de estabilidad del suelo',
    'for sgi cdmh 01 sst 022 formato verificacion de estabilidad del suelo',
    'for sgi cdmh 01 sst 022 formato verificación de estabilidad del suelo',
    'for-sgi-cdmh-01-sst-022-formato-verificacion-de-estabilidad-del-suelo'
  ].includes(key)
}

function isEstabilidadSueloDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-022 FORMATO VERIFICACION DE ESTABILIDAD DEL SUELO') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-022 FORMATO VERIFICACIÓN DE ESTABILIDAD DEL SUELO') ||
    attrs.some((attr) => isEstabilidadSueloDmhType(attr?.type))
}

function hasEstabilidadSueloDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const hasItems = (Array.isArray(attr?.items) ? attr.items : []).some((item) => {
    const estado = String(item?.estado ?? '').trim().toLowerCase()
    const hasEstado = ['segura', 'riesgosa', 'na', 'n/a'].includes(estado)
    const hasObs = String(item?.observaciones ?? '').trim() !== ''
    return hasEstado || hasObs
  })
  const hasResultado = String(attr?.resultadoFinal?.resultado ?? '').trim() !== '' ||
    String(attr?.resultadoFinal?.observaciones ?? '').trim() !== ''
  return hasDatos || hasItems || hasResultado
}

function createAseoDesinfeccionDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-023 PLANILLA DE CONTROL DE ASEO Y DESINFECCIÓN",
    "touch": false,
    "collapsible": false,
    "posicion": 16,
    "attributes": [
      {
        "type": "checkListAseoDesinfeccionDmh",
        "label": "Planilla de Control de Aseo y Desinfeccion DMH",
        "nullable": false,
        "controles": []
      }
    ]
  }
}

function isAseoDesinfeccionDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistaseodesinfecciondmh',
    'check list aseo desinfeccion dmh',
    'planilla de control de aseo y desinfeccion',
    'planilla de control de aseo y desinfección',
    'for sgi cdmh 01 sst 023 planilla de control de aseo y desinfeccion',
    'for sgi cdmh 01 sst 023 planilla de control de aseo y desinfección',
    'for-sgi-cdmh-01-sst-023-planilla-de-control-de-aseo-y-desinfeccion'
  ].includes(key)
}

function isAseoDesinfeccionDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-023 PLANILLA DE CONTROL DE ASEO Y DESINFECCIÓN') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-023 PLANILLA DE CONTROL DE ASEO Y DESINFECCION') ||
    attrs.some((attr) => isAseoDesinfeccionDmhType(attr?.type))
}

function hasAseoDesinfeccionDmhData(attr) {
  return (Array.isArray(attr?.controles) ? attr.controles : []).some((control) => {
    const hasFecha = String(control?.fecha ?? '').trim() !== ''
    const hasRows = (Array.isArray(control?.grupos) ? control.grupos : []).some((group) =>
      (Array.isArray(group?.items) ? group.items : []).some((item) => {
        const estado = String(item?.estado ?? '').trim().toLowerCase()
        const hasEstado = ['si', 'no', 'na', 'n/a', 'c', 'nc', 'nr'].includes(estado)
        const hasObs = String(item?.observacion ?? '').trim() !== ''
        return hasEstado || hasObs
      })
    )
    return hasFecha || hasRows
  })
}

function createControlNeumaticosDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-025 CONTROL E INSPECCIÓN DE NEUMÁTICOS",
    "touch": false,
    "collapsible": false,
    "posicion": 17,
    "attributes": [
      {
        "type": "checkListControlNeumaticosDmh",
        "label": "Control e Inspeccion de Neumaticos DMH",
        "nullable": false,
        "controles": []
      }
    ]
  }
}

function isControlNeumaticosDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcontrolneumaticosdmh',
    'check list control neumaticos dmh',
    'control e inspeccion de neumaticos',
    'control e inspección de neumáticos',
    'for sgi cdmh 01 sst 025 control e inspeccion de neumaticos',
    'for sgi cdmh 01 sst 025 control e inspección de neumáticos',
    'for-sgi-cdmh-01-sst-025-control-e-inspeccion-de-neumaticos'
  ].includes(key)
}

function isControlNeumaticosDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-025 CONTROL E INSPECCIÓN DE NEUMÁTICOS') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-025 CONTROL E INSPECCION DE NEUMATICOS') ||
    attrs.some((attr) => isControlNeumaticosDmhType(attr?.type))
}

function hasControlNeumaticosDmhData(attr) {
  return (Array.isArray(attr?.controles) ? attr.controles : []).some((control) => {
    const hasHeader = ['ejecutante', 'profundidadNeumatico', 'fecha']
      .some((key) => String(control?.[key] ?? '').trim() !== '')
    const hasRows = (Array.isArray(control?.equipos) ? control.equipos : []).some((equipo) =>
      String(equipo?.descripcion ?? '').trim() !== '' ||
      (Array.isArray(equipo?.neumaticos) ? equipo.neumaticos : []).some((row) =>
        [
          'marcaNeumatico',
          'modeloNeumatico',
          'medida',
          'numeroArcajeFuegoSerie',
          'presionInicial',
          'presionFinal',
          'torqueAplicado',
          'observaciones'
        ].some((key) => String(row?.[key] ?? '').trim() !== '')
      )
    )
    return hasHeader || hasRows
  })
}

function createElementosVisibilidadDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-026 CHECKLIST DEL ESTADO OPERATIVO DE ELEMENTOS DE VISIBILIDAD",
    "touch": false,
    "collapsible": false,
    "posicion": 18,
    "attributes": [
      {
        "type": "checkListElementosVisibilidadDmh",
        "label": "Checklist Estado Operativo Elementos de Visibilidad DMH",
        "nullable": false,
        "fechaInicio": "",
        "fechaTermino": "",
        "items": [],
        "observaciones": {}
      }
    ]
  }
}

function isElementosVisibilidadDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistelementosvisibilidaddmh',
    'check list elementos visibilidad dmh',
    'checklist del estado operativo de elementos de visibilidad',
    'for sgi cdmh 01 sst 026 checklist del estado operativo de elementos de visibilidad',
    'for-sgi-cdmh-01-sst-026-checklist-del-estado-operativo-de-elementos-de-visibilidad'
  ].includes(key)
}

function isElementosVisibilidadDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-026 CHECKLIST DEL ESTADO OPERATIVO DE ELEMENTOS DE VISIBILIDAD') ||
    attrs.some((attr) => isElementosVisibilidadDmhType(attr?.type))
}

function hasElementosVisibilidadDmhData(attr) {
  const hasAnswers = (Array.isArray(attr?.items) ? attr.items : []).some((item) =>
    Object.values(item?.days || {}).some((value) =>
      ['b', 'm', 'si', 'no'].includes(String(value ?? '').trim().toLowerCase())
    )
  )
  const hasObs = Object.values(attr?.observaciones || {}).some((value) => String(value ?? '').trim() !== '')
  return hasAnswers || hasObs
}

function createCamionPlumaAmsaSegment() {
  return {
    "label": "CL-SGI-MLP-02-002 CAMION PLUMA REV0",
    "touch": false,
    "collapsible": false,
    "posicion": 19,
    "attributes": [
      {
        "type": "checkListCamionPlumaAmsa",
        "label": "Checklist AMSA Camion Pluma",
        "nullable": false,
        "datos": {
          "contrato": "4644009479",
          "modelo": "",
          "marca": "",
          "patente": "",
          "fecha": "",
          "area": "",
          "kilometraje": "",
          "nombreOperador": "",
          "nombreRigger": "",
          "vencCertificacionCliente": "",
          "horometro": "",
          "vencCertificacionGps": ""
        },
        "grupos": [],
        "pruebas": {},
        "neumaticosSurcos": {
          "estado": "",
          "profundidades": {},
          "observacion": ""
        },
        "observacionesGenerales": ""
      }
    ]
  }
}

function isCamionPlumaAmsaType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamionplumaamsa',
    'check list camion pluma amsa',
    'cl sgi mlp 02 002 camion pluma rev0',
    'cl sgi mlp 02 002 camion pluma',
    'cl-sgi-mlp-02-002-camion-pluma-rev0',
    'camion pluma amsa'
  ].includes(key)
}

function isCamionPlumaAmsaSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-MLP-02-002 CAMION PLUMA REV0') ||
    attrs.some((attr) => isCamionPlumaAmsaType(attr?.type))
}

function hasCamionPlumaAmsaData(attr) {
  const hasHeader = Object.values(attr?.datos || {}).some((value) =>
    String(value ?? '').trim() !== '' && String(value ?? '').trim() !== '4644009479'
  )
  const hasGroups = (Array.isArray(attr?.grupos) ? attr.grupos : []).some((group) =>
    (Array.isArray(group?.items) ? group.items : []).some((item) =>
      String(item?.estado ?? '').trim() !== '' || String(item?.observacion ?? '').trim() !== ''
    )
  )
  const hasTests = Object.values(attr?.pruebas || {}).some((test) =>
    (Array.isArray(test?.items) ? test.items : []).some((item) => String(item?.estado ?? '').trim() !== '') ||
    String(test?.observacion ?? '').trim() !== ''
  )
  const tireData = attr?.neumaticosSurcos || {}
  const hasTires = String(tireData?.estado ?? '').trim() !== '' ||
    String(tireData?.observacion ?? '').trim() !== '' ||
    Object.values(tireData?.profundidades || {}).some((value) => String(value ?? '').trim() !== '')
  return hasHeader || hasGroups || hasTests || hasTires || String(attr?.observacionesGenerales ?? '').trim() !== ''
}

function createCamionetaAmsaSegment() {
  return {
    "label": "CL-SGI-MLP-02-003 CAMIONETA",
    "touch": false,
    "collapsible": false,
    "posicion": 20,
    "attributes": [
      {
        "type": "checkListCamionetaAmsa",
        "label": "Checklist AMSA Camioneta",
        "nullable": false,
        "datos": {
          "nombreConductor": "",
          "kilometros": "",
          "patente": "",
          "fecha": "",
          "obra": "",
          "realizadoPor": "",
          "fechaRealizado": ""
        },
        "fotos": {
          "ladoPasajero": { "label": "Lado pasajero", "observacion": "", "galeria": [] },
          "ladoConductor": { "label": "Lado conductor", "observacion": "", "galeria": [] },
          "vistaFrontal": { "label": "Vista frontal", "observacion": "", "galeria": [] },
          "vistaPosterior": { "label": "Vista posterior", "observacion": "", "galeria": [] }
        },
        "grupos": [],
        "observacionesGenerales": ""
      }
    ]
  }
}

function isCamionetaAmsaType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamionetaamsa',
    'check list camioneta amsa',
    'cl sgi mlp 02 003 camioneta',
    'cl-sgi-mlp-02-003-camioneta',
    'camioneta amsa'
  ].includes(key)
}

function isCamionetaAmsaSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-MLP-02-003 CAMIONETA') ||
    attrs.some((attr) => isCamionetaAmsaType(attr?.type))
}

function hasCamionetaAmsaData(attr) {
  const hasHeader = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const fotos = attr?.fotos && typeof attr.fotos === 'object' ? Object.values(attr.fotos) : []
  const hasFotos = fotos.some((slot) =>
    (Array.isArray(slot?.galeria) && slot.galeria.length > 0) ||
    String(slot?.observacion ?? '').trim() !== ''
  )
  const hasGroups = (Array.isArray(attr?.grupos) ? attr.grupos : []).some((group) =>
    (Array.isArray(group?.items) ? group.items : []).some((item) =>
      String(item?.estado ?? '').trim() !== '' || String(item?.observacion ?? '').trim() !== ''
    )
  )
  return hasHeader || hasFotos || hasGroups || String(attr?.observacionesGenerales ?? '').trim() !== ''
}

const AMSA_GENERATED_SEGMENTS = [
  { label: 'CL-SGI-MLP-02-004 GRUA HORQUILLA (+POST USO)', type: 'checkListGruaHorquillaPostUsoAmsa', attrLabel: 'Checklist AMSA Grua Horquilla Post Uso', posicion: 21 },
  { label: 'CL-SGI-MLP-02-004 GRUA HORQUILLA', type: 'checkListGruaHorquillaAmsa', attrLabel: 'Checklist AMSA Grua Horquilla', posicion: 22 },
  { label: 'CL-SGI-MLP-02-005 GRUA MOVIL REV.2', type: 'checkListGruaMovilAmsa', attrLabel: 'Checklist AMSA Grua Movil', posicion: 23 },
  { label: 'CL-SGI-MLP-02-006 CANCAMOS', type: 'checkListCancamosAmsa', attrLabel: 'Checklist AMSA Cancamos', posicion: 24 },
  { label: 'CL-SGI-MLP-02-007 ESLINGA DE CADENAS', type: 'checkListEslingaCadenasAmsa', attrLabel: 'Checklist AMSA Eslinga de Cadenas', posicion: 25 },
  { label: 'CL-SGI-MLP-02-008 ESLINGAS DE POLIESTER PLANA', type: 'checkListEslingasPoliesterAmsa', attrLabel: 'Checklist AMSA Eslingas de Poliester', posicion: 26 },
  { label: 'CL-SGI-MLP-02-009 ESLINGAS TUBULARES', type: 'checkListEslingasTubularesAmsa', attrLabel: 'Checklist AMSA Eslingas Tubulares', posicion: 27 },
  { label: 'CL-SGI-MLP-02-010 ESTROBOS DE ACERO', type: 'checkListEstrobosAceroAmsa', attrLabel: 'Checklist AMSA Estrobos de Acero', posicion: 28 },
  { label: 'CL-SGI-MLP-02-011 FAJAS DE AMARRE', type: 'checkListFajasAmarreAmsa', attrLabel: 'Checklist AMSA Fajas de Amarre', posicion: 29 },
  { label: 'CL-SGI-MLP-02-012 GRILLETES', type: 'checkListGrilletesAmsa', attrLabel: 'Checklist AMSA Grilletes', posicion: 30 },
  { label: 'CL-SGI-MLP-02-013 ARNES DE SEGURIDAD', type: 'checkListArnesSeguridadAmsa', attrLabel: 'Checklist AMSA Arnes de Seguridad', posicion: 31 },
  { label: 'CL-SGI-MLP-02-014 CAJA INVIERNO REV 0', type: 'checkListCajaInviernoAmsa', attrLabel: 'Checklist AMSA Caja Invierno', posicion: 32 },
  { label: 'CL-SGI-MLP-02-015 ESCALAS PORTATILES', type: 'checkListEscalasPortatilesAmsa', attrLabel: 'Checklist AMSA Escalas Portatiles', posicion: 33 },
  { label: 'CL-SGI-MLP-02-016 INSPECCION DE EPP REV.0', type: 'checkListInspeccionEppAmsa', attrLabel: 'Checklist AMSA Inspeccion de EPP', posicion: 34 },
  { label: 'CL-SGI-MLP-02-017 CHECK-LIST-EXTINTORES', type: 'checkListExtintoresAmsa', attrLabel: 'Checklist AMSA Extintores', posicion: 35 },
  { label: 'CL-SGI-MLP-02-018 CONTROL DE LICENCIAS REV.0', type: 'checkListControlLicenciasAmsa', attrLabel: 'Checklist AMSA Control de Licencias', posicion: 36 },
  { label: 'CL-SGI-MLP-02-019 CHECK LIST CANCAMOS', type: 'checkListCancamosPdfAmsa', attrLabel: 'Checklist AMSA Cancamos PDF', posicion: 37 },
  { label: 'CL-SGI-MLP-02-020 CHECK LIST ESCALA TIPO AVION', type: 'checkListEscalaTipoAvionAmsa', attrLabel: 'Checklist AMSA Escala Tipo Avion', posicion: 38 }
]

const TRANSMAC_GENERATED_SEGMENTS = [
  { label: 'FOR-SEG-006 REVISION EXTINTORES CALAMA', type: 'checkListTransmacExtintoresCalama', attrLabel: 'Revision extintores Calama', checklistId: 'transmacExtintoresCalama', posicion: 60 },
  { label: 'FOR-SEG-006 REVISION EXTINTORES LOS ANDES', type: 'checkListTransmacExtintoresLosAndes', attrLabel: 'Revision extintores Los Andes', checklistId: 'transmacExtintoresLosAndes', posicion: 61 },
  { label: 'FOR-SEG-011 FATIGA Y SOMNOLENCIA', type: 'checkListTransmacFatigaSomnolencia', attrLabel: 'Fatiga y somnolencia', checklistId: 'transmacFatigaSomnolencia', posicion: 62 },
  { label: 'CL-95 HERRAMIENTAS NEUMATICAS', type: 'checkListTransmacHerramientasNeumaticas', attrLabel: 'Herramientas neumaticas', checklistId: 'transmacHerramientasNeumaticas', posicion: 63 },
  { label: 'CL-93 MINI CARGADOR', type: 'checkListTransmacMiniCargador', attrLabel: 'Mini cargador', checklistId: 'transmacMiniCargador', posicion: 64 },
  { label: 'CL-92 CAMION ALJIBE', type: 'checkListTransmacCamionAljibe', attrLabel: 'Camion aljibe', checklistId: 'transmacCamionAljibe', posicion: 65 },
  { label: 'CL-91 CAMION PLUMA', type: 'checkListTransmacCamionPluma', attrLabel: 'Camion pluma', checklistId: 'transmacCamionPluma', posicion: 66 },
  { label: 'CL-90 CARGADOR FRONTAL', type: 'checkListTransmacCargadorFrontal', attrLabel: 'Cargador frontal', checklistId: 'transmacCargadorFrontal', posicion: 67 },
  { label: 'CL-88 CAMION TOLVA', type: 'checkListTransmacCamionTolva', attrLabel: 'Camion tolva', checklistId: 'transmacCamionTolva', posicion: 68 },
  { label: 'CL-87 BULLDOZER', type: 'checkListTransmacBulldozer', attrLabel: 'Bulldozer', checklistId: 'transmacBulldozer', posicion: 69 },
  { label: 'CL-86 EXCAVADORA', type: 'checkListTransmacExcavadora', attrLabel: 'Excavadora', checklistId: 'transmacExcavadora', posicion: 70 },
  { label: 'CL-41 LLAVE DE IMPACTO NEUMATICA', type: 'checkListTransmacLlaveImpactoNeumatica', attrLabel: 'Llave de impacto neumatica', checklistId: 'transmacLlaveImpactoNeumatica', posicion: 71 },
  { label: 'CL-01 SOLDADORA', type: 'checkListTransmacSoldadora', attrLabel: 'Soldadora', checklistId: 'transmacSoldadora', posicion: 72 },
  { label: 'CL-03 ESMERIL ANGULAR', type: 'checkListTransmacEsmerilAngular', attrLabel: 'Esmeril angular', checklistId: 'transmacEsmerilAngular', posicion: 73 },
  { label: 'CL-16 ELEVADOR DE PLATAFORMA', type: 'checkListTransmacElevadorPlataforma', attrLabel: 'Elevador de plataforma', checklistId: 'transmacElevadorPlataforma', posicion: 74 },
  { label: 'CL-09 GANCHOS Y GRILLETES', type: 'checkListTransmacGanchosGrilletes', attrLabel: 'Ganchos y grilletes', checklistId: 'transmacGanchosGrilletes', posicion: 75 },
  { label: 'CL-10 CHECK LIST CADENAS DE AMARRE', type: 'checkListTransmacSpaCadenasAmarre', attrLabel: 'Cadenas de amarre SPA', checklistId: 'transmacSpaCadenasAmarre', posicion: 76 },
  { label: 'CL-11 CHECK LIST ESLINGAS DE AMARRE', type: 'checkListTransmacSpaEslingasAmarre', attrLabel: 'Eslingas de amarre SPA', checklistId: 'transmacSpaEslingasAmarre', posicion: 77 },
  { label: 'CL-14 ELEMENTOS DE IZAJE', type: 'checkListTransmacElementosIzaje', attrLabel: 'Elementos de izaje', checklistId: 'transmacElementosIzaje', posicion: 78 },
  { label: 'CL-96 EVALUACION TERRENO IZAJE', type: 'checkListTransmacEvaluacionTerrenoIzaje', attrLabel: 'Evaluacion terreno izaje', checklistId: 'transmacEvaluacionTerrenoIzaje', posicion: 79 },
  { label: 'CL-SGI-OP-SPA-001 EQUIPOS TRANSPORTE', type: 'checkListTransmacSpaEquiposTransporte', attrLabel: 'Equipos transporte SPA', checklistId: 'transmacSpaEquiposTransporte', posicion: 80 },
  { label: 'FOR-SEG-011 FATIGA Y SOMNOLENCIA SPA', type: 'checkListTransmacFatigaSomnolenciaSpa', attrLabel: 'Fatiga y somnolencia SPA', checklistId: 'transmacFatigaSomnolenciaSpa', posicion: 81 }
]

const CDCH_GENERATED_SEGMENTS = [
  { label: 'CL-SGI-CDCH-02-SST-009 CHECK LIST GRUA', type: 'checkListGruaCdch', attrLabel: 'Checklist CDCH Grua', checklistId: 'cdchGrua', posicion: 12 }
]

const SPOT_CODELCO_GENERATED_SEGMENTS = [
  { label: 'FOR-OP-DN-002 CHECK LIST ESLINGA DE CADENAS', type: 'checkListSpotEslingaCadenasCodelco', attrLabel: 'Checklist SPOT Eslinga de Cadenas', checklistId: 'spotEslingaCadenasCodelco', posicion: 39 },
  { label: 'FOR-OP-DN-003 ESLINGAS DE POLIESTER PLANA', type: 'checkListSpotEslingasPoliesterCodelco', attrLabel: 'Checklist SPOT Eslingas de Poliester', checklistId: 'spotEslingasPoliesterCodelco', posicion: 40 },
  { label: 'FOR-OP-DN-004 ESLINGAS TUBULARES', type: 'checkListSpotEslingasTubularesCodelco', attrLabel: 'Checklist SPOT Eslingas Tubulares', checklistId: 'spotEslingasTubularesCodelco', posicion: 41 },
  { label: 'FOR-OP-DN-005 ESTROBOS DE ACERO', type: 'checkListSpotEstrobosAceroCodelco', attrLabel: 'Checklist SPOT Estrobos de Acero', checklistId: 'spotEstrobosAceroCodelco', posicion: 42 },
  { label: 'FOR-OP-DN-006 GRILLETES', type: 'checkListSpotGrilletesCodelco', attrLabel: 'Checklist SPOT Grilletes', checklistId: 'spotGrilletesCodelco', posicion: 43 },
  { label: 'FOR-OP-DN-008 FAJAS DE AMARRE', type: 'checkListSpotFajasAmarreCodelco', attrLabel: 'Checklist SPOT Fajas de Amarre', checklistId: 'spotFajasAmarreCodelco', posicion: 44 },
  { label: 'FOR-OP-DN-009 ARNES DE SEGURIDAD', type: 'checkListSpotArnesSeguridadCodelco', attrLabel: 'Checklist SPOT Arnes de Seguridad', checklistId: 'spotArnesSeguridadCodelco', posicion: 45 },
  { label: 'FOR-OP-DN-010 ESCALAS PORTATILES', type: 'checkListSpotEscalasPortatilesCodelco', attrLabel: 'Checklist SPOT Escalas Portatiles', checklistId: 'spotEscalasPortatilesCodelco', posicion: 46 },
  { label: 'FOR-OP-DN-011 CHEQUEO CANCAMOS', type: 'checkListSpotCancamosCodelco', attrLabel: 'Checklist SPOT Cancamos', checklistId: 'spotCancamosCodelco', posicion: 47 },
  { label: 'FOR-OP-DN-014 CHECK LIST GRUA', type: 'checkListSpotGruaCodelco', attrLabel: 'Checklist SPOT Grua', checklistId: 'spotGruaCodelco', posicion: 48 },
  { label: 'FOR-OP-DN-015 CHECK LIST ACCESORIOS DE AMARRE', type: 'checkListSpotAccesoriosAmarreCodelco', attrLabel: 'Checklist SPOT Accesorios de Amarre', checklistId: 'spotAccesoriosAmarreCodelco', posicion: 49 },
  { label: 'FOR-OP-DN-016 CHECK LIST MAN-LIFT - ALZAHOMBRE', type: 'checkListSpotAlzaHombreCodelco', attrLabel: 'Checklist SPOT Man-Lift Alzahombre', checklistId: 'spotAlzaHombreCodelco', posicion: 50 },
  { label: 'FOR-OP-DN-019 CHECK LIST DE COMUNICACION RADIAL', type: 'checkListSpotComunicacionRadialCodelco', attrLabel: 'Checklist SPOT Comunicacion Radial', checklistId: 'spotComunicacionRadialCodelco', posicion: 51 }
]

function createAmsaSegment(def) {
  return {
    label: def.label,
    touch: false,
    collapsible: false,
    posicion: def.posicion,
    attributes: [
      {
        type: def.type,
        label: def.attrLabel,
        nullable: false,
        datos: {},
        grupos: [],
        observacionesGenerales: '',
        desviaciones: []
      }
    ]
  }
}

function isAmsaType(type, expectedType) {
  return normalizeText(type) === normalizeText(expectedType)
}

function isAmsaGeneratedType(type) {
  return AMSA_GENERATED_SEGMENTS.some((def) => isAmsaType(type, def.type))
}

function isAmsaSegment(segmento, def) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText(def.label) ||
    attrs.some((attr) => isAmsaType(attr?.type, def.type))
}

function isTransmacGeneratedType(type) {
  return TRANSMAC_GENERATED_SEGMENTS.some((def) => normalizeText(type) === normalizeText(def.type))
}

function isTransmacSegment(segmento, def) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText(def.label) ||
    attrs.some((attr) => normalizeText(attr?.type) === normalizeText(def.type))
}

function agregarSegmentosTransmacPrueba(segmentos) {
  if (!Array.isArray(segmentos)) return
  TRANSMAC_GENERATED_SEGMENTS.forEach((def) => {
    if (!segmentos.some((segmento) => isTransmacSegment(segmento, def))) {
      segmentos.push(createTransmacSegment(def))
    }
  })
}

function getTransmacChecklistId(type) {
  return TRANSMAC_GENERATED_SEGMENTS.find((def) => normalizeText(def.type) === normalizeText(type))?.checklistId || ''
}

function isCdchGeneratedType(type) {
  return CDCH_GENERATED_SEGMENTS.some((def) => normalizeText(type) === normalizeText(def.type))
}

function isCdchGeneratedSegment(segmento, def) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText(def.label) ||
    attrs.some((attr) => normalizeText(attr?.type) === normalizeText(def.type))
}

function getCdchChecklistId(type) {
  return CDCH_GENERATED_SEGMENTS.find((def) => normalizeText(def.type) === normalizeText(type))?.checklistId || ''
}

function createTransmacSegment(def) {
  return {
    label: def.label,
    touch: false,
    collapsible: false,
    posicion: def.posicion,
    attributes: [
      {
        type: def.type,
        label: def.attrLabel,
        nullable: false,
        datos: {},
        grupos: [],
        observacionesGenerales: '',
        desviaciones: []
      }
    ]
  }
}

function createCdchGeneratedSegment(def) {
  return {
    label: def.label,
    touch: false,
    collapsible: false,
    posicion: def.posicion,
    attributes: [
      {
        type: def.type,
        label: def.attrLabel,
        nullable: false,
        datos: {},
        grupos: [],
        observacionesGenerales: ''
      }
    ]
  }
}

function createGruaCdchSegment() {
  return createCdchGeneratedSegment(CDCH_GENERATED_SEGMENTS[0])
}

function createSpotCodelcoSegment(def) {
  if (isSpotComunicacionRadialCodelcoType(def.type)) {
    return {
      label: def.label,
      touch: false,
      collapsible: false,
      posicion: def.posicion,
      attributes: [
        {
          type: def.type,
          label: def.attrLabel,
          nullable: false,
          datos: {
            trabajadorInspecciona: '',
            especialidad: '',
            firmaTrabajador: ''
          },
          fechaInicio: '',
          fechaTermino: '',
          codificacionColores: null,
          body: []
        }
      ]
    }
  }

  return {
    label: def.label,
    touch: false,
    collapsible: false,
    posicion: def.posicion,
    attributes: [
      {
        type: def.type,
        label: def.attrLabel,
        nullable: false,
        datos: {},
        grupos: [],
        observacionesGenerales: ''
      }
    ]
  }
}

function isSpotCodelcoType(type) {
  return SPOT_CODELCO_GENERATED_SEGMENTS.some((def) => normalizeText(type) === normalizeText(def.type))
}

function isSpotCodelcoSegment(segmento, def) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText(def.label) ||
    attrs.some((attr) => normalizeText(attr?.type) === normalizeText(def.type))
}

function getSpotCodelcoChecklistId(type) {
  return SPOT_CODELCO_GENERATED_SEGMENTS.find((def) => normalizeText(def.type) === normalizeText(type))?.checklistId || ''
}

function hasAmsaChecklistData(attr) {
  const hasHeader = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const hasGroups = (Array.isArray(attr?.grupos) ? attr.grupos : []).some((group) =>
    (Array.isArray(group?.items) ? group.items : []).some((item) =>
      String(item?.estado ?? '').trim() !== '' ||
      String(item?.observacion ?? '').trim() !== '' ||
      Object.values(item?.estados || {}).some((value) => String(value ?? '').trim() !== '') ||
      Object.values(item?.extra || {}).some((value) => String(value ?? '').trim() !== '')
    )
  )
  const hasDeviations = (Array.isArray(attr?.desviaciones) ? attr.desviaciones : []).some((row) =>
    ['desviacion', 'accionCorrectiva', 'responsable', 'fechaEjecucion']
      .some((key) => String(row?.[key] ?? '').trim() !== '')
  )
  return hasHeader || hasGroups || hasDeviations || String(attr?.observacionesGenerales ?? '').trim() !== ''
}

function createArnesRespiradorSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-002 CHECK LIST ARNES Y RESPIRADOR",
    "touch": false,
    "collapsible": false,
    "posicion": 2,
    "attributes": [
      {
        "type": "checkListArnesRespirador",
        "label": "Arnes y Respirador",
        "nullable": false,
        "fechaInicio": "",
        "fechasPorDia": {},
        "equipo": {
          "marcaModelo": "",
          "codigoArnes": "",
          "codigoColas": "",
          "codigoAbsImpac": "",
          "codigoRetractil": ""
        },
        "arnes": {
          "groups": []
        },
        "respirador": {
          "items": []
        }
      }
    ]
  }
}

function isArnesRespiradorType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistarnesrespirador',
    'check list arnes respirador',
    'check list arn rs respirador',
    'check list arnés respirador',
    'check list arnes y respirador',
    'check list arnés y respirador',
    'cl sgi cdch 02 sst 002'
  ].includes(key)
}

function isArnesRespiradorSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-002 CHECK LIST ARNES Y RESPIRADOR') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST ARNES Y RESPIRADOR') ||
    attrs.some((attr) => isArnesRespiradorType(attr?.type))
}

function createArnesSeguridadDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-010 CHECK LIST ARNÉS DE SEGURIDAD",
    "touch": false,
    "collapsible": false,
    "posicion": 10,
    "attributes": [
      {
        "type": "checkListArnesSeguridadDmh",
        "label": "Check List Arnes de Seguridad DMH",
        "nullable": false,
        "datos": {
          "faenaContrato": "",
          "area": "",
          "codigoCertArnes": "",
          "codigoCertColas": "",
          "codigoSpdcArnes": "",
          "codigoSpdcColas": ""
        },
        "bloques": []
      }
    ]
  }
}

function isArnesSeguridadDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistarnesseguridaddmh',
    'check list arnes seguridad dmh',
    'check list arnes de seguridad dmh',
    'check list arnes de seguridad',
    'check list arnés de seguridad',
    'for sgi cdmh 01 sst 010 check list arnes de seguridad',
    'for sgi cdmh 01 sst 010',
    'for-sgi-cdmh-01-sst-010'
  ].includes(key)
}

function isArnesSeguridadDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-010 CHECK LIST ARNÉS DE SEGURIDAD') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-010 CHECK LIST ARNES DE SEGURIDAD') ||
    attrs.some((attr) => isArnesSeguridadDmhType(attr?.type))
}

function hasArnesSeguridadDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const blocks = Array.isArray(attr?.bloques)
    ? attr.bloques
    : (Array.isArray(attr?.identificaciones) ? attr.identificaciones : [])
  const hasBlocks = blocks.some((block) => {
    const hasBlockFields = ['identificacion', 'observaciones']
      .some((key) => String(block?.[key] ?? '').trim() !== '')
    const conditions = block?.condiciones && typeof block.condiciones === 'object'
      ? Object.values(block.condiciones)
      : []
    const hasConditions = conditions.some((condition) =>
      String(condition?.estado ?? '').trim() !== '' ||
      String(condition?.accion ?? '').trim() !== '' ||
      String(condition?.responsable ?? '').trim() !== '' ||
      condition?.responsableId != null
    )
    const hasLegacyFields = ['responsable', 'accion']
      .some((key) => String(block?.[key] ?? '').trim() !== '')
    const hasLegacySections = Object.values(block?.secciones || {}).some((value) => String(value ?? '').trim() !== '')
    const hasLegacyAnswers = Object.values(block?.respuestas || {}).some((value) => String(value ?? '').trim() !== '')
    return hasBlockFields || hasConditions || hasLegacyFields || hasLegacySections || hasLegacyAnswers
  })
  return hasDatos || hasBlocks
}

function createElementosIzajeDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-011 CHECK LIST ELEMENTOS DE IZAJE",
    "touch": false,
    "collapsible": false,
    "posicion": 11,
    "attributes": [
      {
        "type": "checkListElementosIzajeDmh",
        "label": "Check List Elementos de Izaje DMH",
        "nullable": false,
        "checklist": {},
        "elementos": [],
        "fallas": []
      }
    ]
  }
}

function isElementosIzajeDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistelementosizajedmh',
    'check list elementos izaje dmh',
    'check list elementos de izaje dmh',
    'check list elementos de izaje',
    'for sgi cdmh 01 sst 011 check list elementos de izaje',
    'for sgi cdmh 01 sst 011',
    'for-sgi-cdmh-01-sst-011'
  ].includes(key)
}

function isElementosIzajeDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-011 CHECK LIST ELEMENTOS DE IZAJE') ||
    attrs.some((attr) => isElementosIzajeDmhType(attr?.type))
}

function hasElementosIzajeDmhData(attr) {
  const checklist = attr?.checklist && typeof attr.checklist === 'object' ? Object.values(attr.checklist) : []
  const hasChecklist = checklist.some((row) =>
    String(row?.cumplimiento ?? '').trim() !== '' ||
    String(row?.situacion ?? '').trim() !== '' ||
    String(row?.medidas ?? '').trim() !== ''
  )
  const elementos = Array.isArray(attr?.elementos) ? attr.elementos : []
  const fallas = Array.isArray(attr?.fallas) ? attr.fallas : []
  const hasElementos = elementos.some((item) =>
    ['descripcion', 'codigoInterno', 'colorMes', 'observacion']
      .some((key) => String(item?.[key] ?? '').trim() !== '')
  )
  const hasFallas = fallas.some((item) =>
    ['codigoFalla', 'fechaDeteccion', 'fechaReparacion', 'observacion']
      .some((key) => String(item?.[key] ?? '').trim() !== '')
  )
  return hasChecklist || hasElementos || hasFallas
}

function createExtintorCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-004 CHECK LIST EXTINTOR",
    "touch": false,
    "collapsible": false,
    "posicion": 3,
    "attributes": [
      {
        "type": "checkListExtintorCdch",
        "label": "Extintor",
        "nullable": false,
        "identificacion": {
          "lugar": "",
          "fechaInspeccion": "",
          "fechaTermino": "",
          "colorMes": ""
        },
        "descripcionEquipo": {
          "numeroInterno": "",
          "capacidadKg": ""
        },
        "componentes": [],
        "observaciones": ""
      }
    ]
  }
}

function isExtintorCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistextintorcdch',
    'check list extintor cdch',
    'check list extintor',
    'cl sgi cdch 02 sst 004'
  ].includes(key)
}

function isExtintorCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-004 CHECK LIST EXTINTOR') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST EXTINTOR') ||
    attrs.some((attr) => isExtintorCdchType(attr?.type))
}

function createGrilleteCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-005 CHECK LIST GRILLETE",
    "touch": false,
    "collapsible": false,
    "posicion": 4,
    "attributes": [
      {
        "type": "checkListGrilleteCdch",
        "label": "Grillete",
        "nullable": false,
        "identificacion": {
          "lugar": "",
          "fechaInspeccion": "",
          "fechaTermino": "",
          "colorMes": ""
        },
        "descripcionEquipo": {
          "medida": "",
          "codificacion": ""
        },
        "componentes": [],
        "observaciones": ""
      }
    ]
  }
}

function isGrilleteCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistgrilletecdch',
    'check list grillete cdch',
    'check list grillete',
    'cl sgi cdch 02 sst 005'
  ].includes(key)
}

function isGrilleteCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-005 CHECK LIST GRILLETE') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST GRILLETE') ||
    attrs.some((attr) => isGrilleteCdchType(attr?.type))
}

function createRetractilCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-006 CHECK LIST RETRACTIL",
    "touch": false,
    "collapsible": false,
    "posicion": 5,
    "attributes": [
      {
        "type": "checkListRetractilCdch",
        "label": "Retractil",
        "nullable": false,
        "identificacion": {
          "lugar": "",
          "fechaInspeccion": "",
          "fechaTermino": "",
          "colorMes": ""
        },
        "descripcionEquipo": {
          "marca": "",
          "modelo": ""
        },
        "componentes": [],
        "observaciones": ""
      }
    ]
  }
}

function isRetractilCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistretractilcdch',
    'check list retractil cdch',
    'check list retractil',
    'check list retráctil',
    'cl sgi cdch 02 sst 006'
  ].includes(key)
}

function isRetractilCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-006 CHECK LIST RETRACTIL') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST RETRACTIL') ||
    attrs.some((attr) => isRetractilCdchType(attr?.type))
}

function createEslingasTubularesCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-007 ESLINGAS TUBULARES",
    "touch": false,
    "collapsible": false,
    "posicion": 6,
    "attributes": [
      {
        "type": "checkListEslingasTubularesCdch",
        "label": "Eslingas Tubulares",
        "nullable": false,
        "descripcion": {
          "largo": "",
          "factorSeguridad": "",
          "cargaSeguraTrabajo": ""
        },
        "condiciones": [],
        "desviaciones": []
      }
    ]
  }
}

function isEslingasTubularesCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklisteslingastubularescdch',
    'check list eslingas tubulares cdch',
    'check list eslingas tubulares',
    'eslingas tubulares',
    'cl sgi cdch 02 sst 007'
  ].includes(key)
}

function isEslingasTubularesCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-007 ESLINGAS TUBULARES') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST ESLINGAS TUBULARES') ||
    attrs.some((attr) => isEslingasTubularesCdchType(attr?.type))
}

function createControlVientoCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-008 CONTROL DE VIENTO",
    "touch": false,
    "collapsible": false,
    "posicion": 7,
    "attributes": [
      {
        "type": "checkListControlVientoCdch",
        "label": "Control de Viento",
        "nullable": false,
        "datos": {
          "equipo": "",
          "fecha": "",
          "operador": "",
          "tarea": "",
          "rigger": "",
          "firma": ""
        },
        "lecturas": []
      }
    ]
  }
}

function isControlVientoCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcontrolvientocdch',
    'check list control de viento cdch',
    'check list control de viento',
    'control de viento',
    'cl sgi cdch 02 sst 008'
  ].includes(key)
}

function isControlVientoCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-008 CONTROL DE VIENTO') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST CONTROL DE VIENTO') ||
    attrs.some((attr) => isControlVientoCdchType(attr?.type))
}

function createVerificacionSueloCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-013 FORMATO VERIFICACION DEL SUELO",
    "touch": false,
    "collapsible": false,
    "posicion": 8,
    "attributes": [
      {
        "type": "checkListVerificacionSueloCdch",
        "label": "Verificacion del Suelo",
        "nullable": false,
        "datos": {
          "fecha": "",
          "faenaDivision": "",
          "sectorUbicacion": "",
          "modeloGrua": "",
          "supervisorTransmac": "",
          "operadorGrua": "",
          "riggerSenalero": ""
        },
        "items": [],
        "resultadoFinal": {
          "resultado": "",
          "observaciones": ""
        }
      }
    ]
  }
}

function isVerificacionSueloCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistverificacionsuelocdch',
    'check list verificacion del suelo cdch',
    'check list verificacion del suelo',
    'check list verificación del suelo',
    'formato verificacion del suelo',
    'formato verificación del suelo',
    'cl sgi cdch 02 sst 013'
  ].includes(key)
}

function isVerificacionSueloCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-013 FORMATO VERIFICACION DEL SUELO') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST VERIFICACION DEL SUELO') ||
    attrs.some((attr) => isVerificacionSueloCdchType(attr?.type))
}

function createAccesoriosAmarreCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-014 CHECK LIST ACCESORIOS DE AMARRE",
    "touch": false,
    "collapsible": false,
    "posicion": 9,
    "attributes": [
      {
        "type": "checkListAccesoriosAmarreCdch",
        "label": "Accesorios de Amarre",
        "nullable": false,
        "datos": {
          "nombre": "",
          "cargo": "",
          "rut": "",
          "fecha": "",
          "hora": "",
          "equipo": "",
          "marca": "",
          "modelo": "",
          "patente": ""
        },
        "grupos": {},
        "observaciones": ""
      }
    ]
  }
}

function isAccesoriosAmarreCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistaccesoriosamarrecdch',
    'check list accesorios de amarre cdch',
    'check list accesorios de amarre',
    'check list accesorios amarre',
    'cl sgi cdch 02 sst 014'
  ].includes(key)
}

function isAccesoriosAmarreCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-014 CHECK LIST ACCESORIOS DE AMARRE') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST ACCESORIOS DE AMARRE') ||
    attrs.some((attr) => isAccesoriosAmarreCdchType(attr?.type))
}

function createCamaBajaCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-003 CHECK LIST DIARIO CAMA BAJA",
    "touch": false,
    "collapsible": false,
    "posicion": 10,
    "attributes": [
      {
        "type": "checkListCamaBajaCdch",
        "label": "Cama Baja",
        "nullable": false,
        "secciones": {}
      }
    ]
  }
}

function isCamaBajaCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamabajacdch',
    'check list cama baja cdch',
    'check list diario cama baja',
    'check list diario cama baja rv 0',
    'cl-sgi-cdch-02-sst-003',
    'cl sgi cdch 02 sst 003',
    'check list de maquinaria cama baja'
  ].includes(key)
}

function isCamaBajaCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CL-SGI-CDCH-02-SST-003 CHECK LIST DIARIO CAMA BAJA') ||
    normalizeText(segmento?.label) === normalizeText('CHECK LIST DIARIO CAMA BAJA') ||
    attrs.some((attr) => isCamaBajaCdchType(attr?.type))
}

function hasCamaBajaCdchData(attr) {
  const secciones = attr?.secciones && typeof attr.secciones === 'object' ? Object.values(attr.secciones) : []
  return secciones.some((items) => (Array.isArray(items) ? items : []).some((item) =>
    ['ok', 'no', 'na', 'n/a'].includes(String(item?.estado ?? '').trim().toLowerCase()) ||
    String(item?.observaciones ?? item?.observacion ?? '').trim() !== ''
  ))
}

function createCamionetaCdchSegment() {
  return {
    "label": "CL-SGI-CDCH-02-SST-012 CHECK LIST PARA VEHICULOS LIVIANOS CAMIONETA",
    "touch": false,
    "collapsible": false,
    "posicion": 11,
    "attributes": [
      {
        "type": "checkListCamionetaCdch",
        "label": "Camioneta",
        "nullable": false,
        "datos": {
          "nombreConductor": "",
          "kilometros": "",
          "patente": "",
          "fecha": ""
        },
        "fotos": {
          "frontal": { "label": "Frontal", "galeria": [] },
          "trasera": { "label": "Trasera", "galeria": [] },
          "lateralIzquierda": { "label": "Lateral izquierda", "galeria": [] },
          "lateralDerecha": { "label": "Lateral derecha", "galeria": [] }
        },
        "secciones": {},
        "cierre": {
          "obra": "",
          "realizadoPor": "",
          "fecha": "",
          "firmaRealiza": "",
          "tomaConocimiento": ""
        },
        "observacionesDetectadas": ""
      }
    ]
  }
}

function isCamionetaCdchType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamionetacdch',
    'check list camioneta cdch',
    'check list camioneta',
    'check list para vehiculos livianos camioneta',
    'cl-sgi-cdch-02-sst-012',
    'cl sgi cdch 02 sst 012'
  ].includes(key)
}

function isCamionetaCdchSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CHECK LIST CAMIONETA') ||
    attrs.some((attr) => isCamionetaCdchType(attr?.type))
}

function hasCamionetaCdchData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const fotos = attr?.fotos && typeof attr.fotos === 'object' ? Object.values(attr.fotos) : []
  const hasFotos = fotos.some((slot) => Array.isArray(slot?.galeria) && slot.galeria.length > 0)
  const secciones = attr?.secciones && typeof attr.secciones === 'object' ? Object.values(attr.secciones) : []
  const hasItems = secciones.some((items) => (Array.isArray(items) ? items : []).some((item) =>
    ['si', 'no'].includes(String(item?.estado ?? '').trim().toLowerCase()) ||
    String(item?.observacion ?? item?.observaciones ?? '').trim() !== ''
  ))
  const hasCierre = Object.values(attr?.cierre || {}).some((value) => String(value ?? '').trim() !== '')
  const hasObs = String(attr?.observacionesDetectadas ?? '').trim() !== ''
  return hasDatos || hasFotos || hasItems || hasCierre || hasObs
}

function createCamionetaDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-015 INSPECCION CAMIONETA",
    "touch": false,
    "collapsible": false,
    "posicion": 12,
    "attributes": [
      {
        "type": "checkListCamionetaDmh",
        "label": "Inspeccion Camioneta DMH",
        "nullable": false,
        "datos": {
          "patente": "",
          "proximaMantencion": todayIsoDate()
        },
        "fotos": {
          "frontal": { "label": "Frontal", "observacion": "", "galeria": [] },
          "trasera": { "label": "Trasera", "observacion": "", "galeria": [] },
          "lateralIzquierda": { "label": "Lateral izquierda", "observacion": "", "galeria": [] },
          "lateralDerecha": { "label": "Lateral derecha", "observacion": "", "galeria": [] }
        },
        "fechas": {
          "miercoles": todayIsoDate(),
          "jueves": "",
          "viernes": "",
          "sabado": "",
          "domingo": "",
          "lunes": "",
          "martes": ""
        },
        "respuestas": {},
        "observacionesDanos": "",
        "notas": [
          "En caso de declarar alguna condicion critica, el conductor esta obligado a detener el vehiculo, no iniciar sus servicios e informar tal condicion a su supervisor. Sera obligacion del supervisor chequear la condicion informada y derivar al vehiculo al taller correspondiente.",
          "B = BUENO, M = MALO."
        ]
      }
    ]
  }
}

function isCamionetaDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamionetadmh',
    'check list camioneta dmh',
    'inspeccion camioneta dmh',
    'for sgi cdmh 01 sst 015 inspeccion camioneta',
    'for sgi cdmh 01 sst 015',
    'for-sgi-cdmh-01-sst-015'
  ].includes(key)
}

function isCamionetaDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-015 INSPECCION CAMIONETA') ||
    attrs.some((attr) => isCamionetaDmhType(attr?.type))
}

function hasCamionetaDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const fotos = attr?.fotos && typeof attr.fotos === 'object' ? Object.values(attr.fotos) : []
  const hasFotos = fotos.some((slot) =>
    (Array.isArray(slot?.galeria) && slot.galeria.length > 0) ||
    String(slot?.observacion ?? '').trim() !== ''
  )
  const hasFechas = Object.values(attr?.fechas || {}).some((value) => String(value ?? '').trim() !== '')
  const respuestas = attr?.respuestas && typeof attr.respuestas === 'object' ? Object.values(attr.respuestas) : []
  const hasRespuestas = respuestas.some((days) =>
    days && typeof days === 'object' && Object.values(days).some((value) => String(value ?? '').trim() !== '')
  )
  const hasObs = String(attr?.observacionesDanos ?? '').trim() !== ''
  return hasDatos || hasFotos || hasFechas || hasRespuestas || hasObs
}

function createCamionRamplaDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-016 CHECK LIST CAMION RAMPLA",
    "touch": false,
    "collapsible": false,
    "posicion": 13,
    "attributes": [
      {
        "type": "checkListCamionRamplaDmh",
        "label": "Check List Camion Rampla DMH",
        "nullable": false,
        "datos": {
          "patente": "",
          "proximaMantencion": todayIsoDate()
        },
        "fechas": {
          "miercoles": todayIsoDate(),
          "jueves": "",
          "viernes": "",
          "sabado": "",
          "domingo": "",
          "lunes": "",
          "martes": ""
        },
        "mediciones": {},
        "respuestas": {},
        "observacionesDanos": "",
        "notas": [
          "En caso de declarar alguna condicion critica, el conductor esta obligado a detener el vehiculo, no iniciar sus servicios e informar tal condicion a su supervisor. Sera obligacion del supervisor chequear la condicion informada y derivar al vehiculo al taller correspondiente.",
          "B = BUENO, M = MALO."
        ]
      }
    ]
  }
}

function isCamionRamplaDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamionrampladmh',
    'check list camion rampla dmh',
    'check list camion rampla',
    'for sgi cdmh 01 sst 016 check list camion rampla',
    'for sgi cdmh 01 sst 016',
    'for-sgi-cdmh-01-sst-016'
  ].includes(key)
}

function isCamionRamplaDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-016 CHECK LIST CAMION RAMPLA') ||
    attrs.some((attr) => isCamionRamplaDmhType(attr?.type))
}

function hasCamionRamplaDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const hasFechas = Object.values(attr?.fechas || {}).some((value) => String(value ?? '').trim() !== '')
  const respuestas = attr?.respuestas && typeof attr.respuestas === 'object' ? Object.values(attr.respuestas) : []
  const hasRespuestas = respuestas.some((days) =>
    days && typeof days === 'object' && Object.values(days).some((value) => String(value ?? '').trim() !== '')
  )
  const mediciones = attr?.mediciones && typeof attr.mediciones === 'object' ? Object.values(attr.mediciones) : []
  const hasMediciones = mediciones.some((day) =>
    day && typeof day === 'object' && Object.values(day).some((value) => String(value ?? '').trim() !== '')
  )
  const hasObs = String(attr?.observacionesDanos ?? '').trim() !== ''
  return hasDatos || hasFechas || hasRespuestas || hasMediciones || hasObs
}

function createGruaHorquillaDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-017 CHECK LIST GRUA HORQUILLA",
    "touch": false,
    "collapsible": false,
    "posicion": 14,
    "attributes": [
      {
        "type": "checkListGruaHorquillaDmh",
        "label": "Check List Grua Horquilla DMH",
        "nullable": false,
        "datos": {
          "patente": "",
          "proximaMantencion": todayIsoDate()
        },
        "fotos": {
          "adelante": { "label": "Adelante", "galeria": [] },
          "atras": { "label": "Atras", "galeria": [] },
          "derecha": { "label": "Derecha", "galeria": [] },
          "izquierda": { "label": "Izquierda", "galeria": [] }
        },
        "fechas": {
          "miercoles": todayIsoDate(),
          "jueves": "",
          "viernes": "",
          "sabado": "",
          "domingo": "",
          "lunes": "",
          "martes": ""
        },
        "mediciones": {},
        "respuestas": {},
        "observacionesDanos": "",
        "notas": [
          "B = BUENO, M = MALO."
        ]
      }
    ]
  }
}

function isGruaHorquillaDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistgruahorquilladmh',
    'check list grua horquilla dmh',
    'check list grua horquilla',
    'for sgi cdmh 01 sst 017 check list grua horquilla',
    'for sgi cdmh 01 sst 017',
    'for-sgi-cdmh-01-sst-017'
  ].includes(key)
}

function isGruaHorquillaDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-017 CHECK LIST GRUA HORQUILLA') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-017 CHECK LIST GRÚA HORQUILLA') ||
    attrs.some((attr) => isGruaHorquillaDmhType(attr?.type))
}

function hasGruaHorquillaDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const fotos = attr?.fotos && typeof attr.fotos === 'object' ? Object.values(attr.fotos) : []
  const hasFotos = fotos.some((slot) => Array.isArray(slot?.galeria) && slot.galeria.length > 0)
  const hasFechas = Object.values(attr?.fechas || {}).some((value) => String(value ?? '').trim() !== '')
  const respuestas = attr?.respuestas && typeof attr.respuestas === 'object' ? Object.values(attr.respuestas) : []
  const hasRespuestas = respuestas.some((days) =>
    days && typeof days === 'object' && Object.values(days).some((value) => String(value ?? '').trim() !== '')
  )
  const mediciones = attr?.mediciones && typeof attr.mediciones === 'object' ? Object.values(attr.mediciones) : []
  const hasMediciones = mediciones.some((day) =>
    day && typeof day === 'object' && Object.values(day).some((value) => String(value ?? '').trim() !== '')
  )
  const hasObs = String(attr?.observacionesDanos ?? '').trim() !== ''
  return hasDatos || hasFotos || hasFechas || hasRespuestas || hasMediciones || hasObs
}

function createCamionGruaDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-018 CHECK LIST CAMION GRUA",
    "touch": false,
    "collapsible": false,
    "posicion": 15,
    "attributes": [
      {
        "type": "checkListCamionGruaDmh",
        "label": "Check List Camion Grua DMH",
        "nullable": false,
        "datos": {
          "patente": "",
          "proximaMantencion": todayIsoDate()
        },
        "fechas": {
          "miercoles": todayIsoDate(),
          "jueves": "",
          "viernes": "",
          "sabado": "",
          "domingo": "",
          "lunes": "",
          "martes": ""
        },
        "mediciones": {},
        "respuestas": {},
        "observacionesDanos": "",
        "notas": [
          "B = BUENO, M = MALO."
        ]
      }
    ]
  }
}

function isCamionGruaDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamiongruadmh',
    'check list camion grua dmh',
    'check list camion grua',
    'for sgi cdmh 01 sst 018 check list camion grua',
    'for sgi cdmh 01 sst 018',
    'for-sgi-cdmh-01-sst-018'
  ].includes(key)
}

function isCamionGruaDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-018 CHECK LIST CAMION GRUA') ||
    normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-018 CHECK LIST CAMION GRÚA') ||
    attrs.some((attr) => isCamionGruaDmhType(attr?.type))
}

function hasCamionGruaDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const hasFechas = Object.values(attr?.fechas || {}).some((value) => String(value ?? '').trim() !== '')
  const respuestas = attr?.respuestas && typeof attr.respuestas === 'object' ? Object.values(attr.respuestas) : []
  const hasRespuestas = respuestas.some((days) =>
    days && typeof days === 'object' && Object.values(days).some((value) => String(value ?? '').trim() !== '')
  )
  const mediciones = attr?.mediciones && typeof attr.mediciones === 'object' ? Object.values(attr.mediciones) : []
  const hasMediciones = mediciones.some((day) =>
    day && typeof day === 'object' && Object.values(day).some((value) => String(value ?? '').trim() !== '')
  )
  const hasObs = String(attr?.observacionesDanos ?? '').trim() !== ''
  return hasDatos || hasFechas || hasRespuestas || hasMediciones || hasObs
}

function createCamionPlumaDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-019 CHECK LIST CAMION PLUMA",
    "touch": false,
    "collapsible": false,
    "posicion": 16,
    "attributes": [
      {
        "type": "checkListCamionPlumaDmh",
        "label": "Check List Camion Pluma DMH",
        "nullable": false,
        "datos": {
          "patente": "",
          "proximaMantencion": todayIsoDate()
        },
        "fechas": {
          "miercoles": todayIsoDate(),
          "jueves": "",
          "viernes": "",
          "sabado": "",
          "domingo": "",
          "lunes": "",
          "martes": ""
        },
        "mediciones": {},
        "respuestas": {},
        "observacionesDanos": "",
        "notas": [
          "B = BUENO, M = MALO."
        ]
      }
    ]
  }
}

function isCamionPlumaDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistcamionplumadmh',
    'check list camion pluma dmh',
    'check list camion pluma',
    'for sgi cdmh 01 sst 019 check list camion pluma',
    'for sgi cdmh 01 sst 019',
    'for-sgi-cdmh-01-sst-019'
  ].includes(key)
}

function isCamionPlumaDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-019 CHECK LIST CAMION PLUMA') ||
    attrs.some((attr) => isCamionPlumaDmhType(attr?.type))
}

function hasCamionPlumaDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const hasFechas = Object.values(attr?.fechas || {}).some((value) => String(value ?? '').trim() !== '')
  const respuestas = attr?.respuestas && typeof attr.respuestas === 'object' ? Object.values(attr.respuestas) : []
  const hasRespuestas = respuestas.some((days) =>
    days && typeof days === 'object' && Object.values(days).some((value) => String(value ?? '').trim() !== '')
  )
  const mediciones = attr?.mediciones && typeof attr.mediciones === 'object' ? Object.values(attr.mediciones) : []
  const hasMediciones = mediciones.some((day) =>
    day && typeof day === 'object' && Object.values(day).some((value) => String(value ?? '').trim() !== '')
  )
  const hasObs = String(attr?.observacionesDanos ?? '').trim() !== ''
  return hasDatos || hasFechas || hasRespuestas || hasMediciones || hasObs
}

function createAlzaHombreDmhSegment() {
  return {
    "label": "FOR-SGI-CDMH-01-SST-020 CHECK LIST ALZA HOMBRE",
    "touch": false,
    "collapsible": false,
    "posicion": 17,
    "attributes": [
      {
        "type": "checkListAlzaHombreDmh",
        "label": "Check List Alza Hombre DMH",
        "nullable": false,
        "datos": {
          "patente": "",
          "proximaMantencion": todayIsoDate()
        },
        "fechas": {
          "miercoles": todayIsoDate(),
          "jueves": "",
          "viernes": "",
          "sabado": "",
          "domingo": "",
          "lunes": "",
          "martes": ""
        },
        "mediciones": {},
        "respuestas": {},
        "observacionesDanos": "",
        "notas": [
          "B = BUENO, M = MALO."
        ]
      }
    ]
  }
}

function isAlzaHombreDmhType(type) {
  const key = normalizeText(type).replace(/[-_]/g, ' ').replace(/\s+/g, ' ')
  return [
    'checklistalzahombredmh',
    'check list alza hombre dmh',
    'check list alza hombre',
    'for sgi cdmh 01 sst 020 check list alza hombre',
    'for sgi cdmh 01 sst 020',
    'for-sgi-cdmh-01-sst-020'
  ].includes(key)
}

function isAlzaHombreDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-020 CHECK LIST ALZA HOMBRE') ||
    attrs.some((attr) => isAlzaHombreDmhType(attr?.type))
}

function hasAlzaHombreDmhData(attr) {
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const hasFechas = Object.values(attr?.fechas || {}).some((value) => String(value ?? '').trim() !== '')
  const respuestas = attr?.respuestas && typeof attr.respuestas === 'object' ? Object.values(attr.respuestas) : []
  const hasRespuestas = respuestas.some((days) =>
    days && typeof days === 'object' && Object.values(days).some((value) => String(value ?? '').trim() !== '')
  )
  const mediciones = attr?.mediciones && typeof attr.mediciones === 'object' ? Object.values(attr.mediciones) : []
  const hasMediciones = mediciones.some((day) =>
    day && typeof day === 'object' && Object.values(day).some((value) => String(value ?? '').trim() !== '')
  )
  const hasObs = String(attr?.observacionesDanos ?? '').trim() !== ''
  return hasDatos || hasFechas || hasRespuestas || hasMediciones || hasObs
}

function isComunicacionRadialSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('CHECK LIST COMUNICACIÓN RADIAL') ||
    attrs.some((attr) => isComunicacionRadialType(attr?.type))
}

function isComunicacionRadialDmhSegment(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return normalizeText(segmento?.label) === normalizeText('FOR-SGI-CDMH-01-SST-012 CHECK LIST DE COMUNICACIÓN RADIAL') ||
    attrs.some((attr) => isComunicacionRadialDmhType(attr?.type))
}

function getComunicacionRadialAttr(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return attrs.find((attr) => isComunicacionRadialType(attr?.type) || isComunicacionRadialDmhType(attr?.type) || isSpotComunicacionRadialCodelcoType(attr?.type)) || null
}

function hasComunicacionRadialData(segmento) {
  const attr = getComunicacionRadialAttr(segmento)
  if (!attr) return false

  const hasFecha = normalizeDateForInput(attr.fechaInicio) !== ''
  const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '')
  const rows = Array.isArray(attr.body) ? attr.body : []
  const hasAnswers = rows.some((row) => {
    const days = row?.days || {}
    return Object.values(days).some((value) => String(value ?? '').trim() !== '')
  })
  const colorCoding = normalizeComunicacionRadialColorCoding(attr.codificacionColores)
  const hasColorCoding =
    String(colorCoding.observacion || '').trim() !== '' ||
    Object.values(colorCoding.meses || {}).some((value) => String(value ?? '').trim() !== '')

  return hasFecha || hasDatos || hasAnswers || hasColorCoding
}

function hasComunicacionRadialAnswers(segmento) {
  const attr = getComunicacionRadialAttr(segmento)
  const rows = Array.isArray(attr?.body) ? attr.body : []
  return rows.some((row) => {
    const days = row?.days || {}
    return Object.values(days).some((value) => String(value ?? '').trim() !== '')
  })
}

function mergeComunicacionRadialSegmentos(targetSegmento, sourceSegmentos) {
  const targetAttr = getComunicacionRadialAttr(targetSegmento)
  if (!targetAttr) return

  sourceSegmentos.forEach((segmento) => {
    const sourceAttr = getComunicacionRadialAttr(segmento)
    if (!sourceAttr || sourceAttr === targetAttr) return

    const sourceFecha = normalizeDateForInput(sourceAttr.fechaInicio)
    const targetFecha = normalizeDateForInput(targetAttr.fechaInicio)
    if (sourceFecha && (!targetFecha || targetFecha === todayIsoDate())) {
      targetAttr.fechaInicio = sourceFecha
    }

    const sourceBody = Array.isArray(sourceAttr.body) ? sourceAttr.body : []
    const targetBody = Array.isArray(targetAttr.body) ? targetAttr.body : []
    if (sourceBody.length && !targetBody.length) {
      targetAttr.body = sourceBody
    }

    const sourceColorCoding = normalizeComunicacionRadialColorCoding(sourceAttr.codificacionColores)
    const targetColorCoding = normalizeComunicacionRadialColorCoding(targetAttr.codificacionColores)
    const sourceHasColorCoding =
      String(sourceColorCoding.observacion || '').trim() !== '' ||
      Object.values(sourceColorCoding.meses || {}).some((value) => String(value ?? '').trim() !== '')
    const targetHasColorCoding =
      String(targetColorCoding.observacion || '').trim() !== '' ||
      Object.values(targetColorCoding.meses || {}).some((value) => String(value ?? '').trim() !== '')

    if (sourceHasColorCoding && !targetHasColorCoding) {
      targetAttr.codificacionColores = sourceColorCoding
    }
  })
}

function normalizeComunicacionRadialColorCoding(saved) {
  const legacyRows = Array.isArray(saved) ? saved : []
  const source = saved && !Array.isArray(saved) && typeof saved === 'object' ? saved : {}
  const sourceMonths = source.meses && typeof source.meses === 'object' ? source.meses : {}
  const validColors = new Set(['amarillo', 'rojo', 'azul', 'verde'])
  const monthKeys = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ]

  const meses = monthKeys.reduce((acc, monthKey) => {
    const legacyColor = legacyRows.find((row) => row?.meses?.[monthKey])?.key || ''
    const value = sourceMonths[monthKey] || legacyColor || ''
    acc[monthKey] = validColors.has(value) ? value : ''
    return acc
  }, {})

  return {
    observacion: source.observacion || legacyRows.find((row) => row?.observacion)?.observacion || '',
    coloresManuales: source.coloresManuales === true,
    meses
  }
}

function dedupeComunicacionRadialSegmentos(segmentos) {
  if (!Array.isArray(segmentos)) return

  const radialIndexes = segmentos
    .map((segmento, index) => ({ segmento, index }))
    .filter(({ segmento }) => isComunicacionRadialSegment(segmento))

  if (radialIndexes.length <= 1) return

  const keep = radialIndexes.find(({ segmento }) => hasComunicacionRadialAnswers(segmento)) ||
    radialIndexes.find(({ segmento }) => hasComunicacionRadialData(segmento)) ||
    radialIndexes[0]

  mergeComunicacionRadialSegmentos(
    keep.segmento,
    radialIndexes.map(({ segmento }) => segmento)
  )

  for (let i = radialIndexes.length - 1; i >= 0; i -= 1) {
    const current = radialIndexes[i]
    if (current.index !== keep.index) segmentos.splice(current.index, 1)
  }
}

function normalizeComunicacionRadialBeforeSave(bodyExec) {
  if (!bodyExec || typeof bodyExec !== 'object') return
  if (!Array.isArray(bodyExec.segmentos)) bodyExec.segmentos = []

  const segmentos = bodyExec.segmentos
  dedupeComunicacionRadialSegmentos(segmentos)

  segmentos.forEach((segmento) => {
    const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
    attrs.forEach((attr) => {
      if (!isComunicacionRadialType(attr?.type) && !isComunicacionRadialDmhType(attr?.type) && !isSpotComunicacionRadialCodelcoType(attr?.type)) return
      attr.fechaInicio = normalizeDateForInput(attr.fechaInicio) || todayIsoDate()
      attr.codificacionColores = normalizeComunicacionRadialColorCoding(attr.codificacionColores)
    })
  })
}

async function cargarNombresUsuarios() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerUsuarios')
    const rows = Array.isArray(data) ? data : []
    const next = {}
    for (const u of rows) {
      const id = Number(u?.id_user)
      const nombre = String(u?.nombre_user ?? '').trim()
      if (!Number.isNaN(id) && nombre) next[id] = nombre
    }
    nombresUsuariosById.value = next
    conexionHeaderDataCache.clear()
  } catch (error) {
    console.warn('[Inspeccion] No se pudo cargar catálogo de usuarios:', error?.response?.data || error?.message)
  }
}

const TEMPLATE_ID_RESPONSABLE_GESTION = 143
const LABEL_RESPONSABLE_GESTION = 'Nombre Responsable de Gestión'

function normalizeText(value) {
  return (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function formatoHoraLlegada(date = new Date()) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function isRegistroFotograficoLlegadaDomicilio(attr) {
  const lbl = normalizeText(attr?.label)
  return lbl === normalizeText('Registro Fotográfico Llegada al Domicilio') ||
    lbl === normalizeText('Registro Fotografico Llegada al Domicilio')
}

function onPhotoCaptureGaleriaUpdate(attr, val) {
  if (Array.isArray(val)) attr.galeria = val

  // Campo oculto para técnico: se registra automáticamente al adjuntar foto
  if (
    isRegistroFotograficoLlegadaDomicilio(attr) &&
    Array.isArray(attr?.galeria) &&
    attr.galeria.length > 0 &&
    !String(attr?.hora_llegada || '').trim()
  ) {
    attr.hora_llegada = formatoHoraLlegada()
  }

  segmentosCompletos()
}

function parseLocalRolesNames() {
  const raw = localStorage.getItem('rolesNames')
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean)
    }
  } catch {}
  return String(raw)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean)
}

const hasCnxRole = computed(() => {
  const fromUserDetail = Array.isArray(userDetailStore.userDetail?.usuarioRoles)
    ? userDetailStore.userDetail.usuarioRoles.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean)
    : []
  const allRoles = [...fromUserDetail, ...parseLocalRolesNames()]
  return allRoles.some(name => String(name || '').trim().toUpperCase().startsWith('CNX'))
})

const hasSupervisorRole = computed(() => {
  const fromUserDetail = Array.isArray(userDetailStore.userDetail?.usuarioRoles)
    ? userDetailStore.userDetail.usuarioRoles.map(r => (typeof r === 'string' ? r : r?.name_rol)).filter(Boolean)
    : []
  const allRoles = [...fromUserDetail, ...parseLocalRolesNames()]
  return allRoles.some(name => normalizeText(name).includes('supervisor'))
})

function isValidEmail(email) {
  const value = (email ?? '').toString().trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function getResponsableGestionEmailFromSurvey(survey) {
  const rawBody = survey?.body_exec
  const body = typeof rawBody === 'string'
    ? (() => {
      try { return JSON.parse(rawBody) } catch { return null }
    })()
    : rawBody

  if (!body) return ''

  const targetLabel = normalizeText(LABEL_RESPONSABLE_GESTION)
  let found = ''

  const walk = (node) => {
    if (!node || found) return

    if (Array.isArray(node)) {
      node.forEach(walk)
      return
    }

    if (typeof node !== 'object') return

    const label = normalizeText(node?.label)
    if (label === targetLabel) {
      const candidate = (node?.default ?? node?.value ?? node?.selected ?? '').toString().trim()
      if (candidate) {
        found = candidate
        return
      }
    }

    Object.values(node).forEach(walk)
  }

  walk(body)
  return found
}

function isConexionSurvey(survey) {
  const texto = normalizeText([
    survey?.desc_template_srv,
    survey?.name_template_srv,
    survey?.name_tipo_srv,
    survey?.codi_template_srv
  ].join(' '))
  return texto.includes('conexion') || texto.includes('conexiones')
}

function parseBodyExecSafe(bodyExecRaw) {
  return normalizeBodyExecContainer(bodyExecRaw)
}

function findAttrByLabels(node, labelNormSet) {
  let found = null
  const walk = (current) => {
    if (!current || found) return
    if (Array.isArray(current)) {
      current.forEach(walk)
      return
    }
    if (typeof current !== 'object') return

    const label = normalizeText(current?.label ?? current?.text ?? current?.name)
    if (label && labelNormSet.has(label)) {
      found = current
      return
    }

    Object.values(current).forEach(walk)
  }
  walk(node)
  return found
}

function findBestAttrByLabels(node, labelNormSet, { requireGaleria = false } = {}) {
  const candidates = []
  const walk = (current) => {
    if (!current) return
    if (Array.isArray(current)) {
      current.forEach(walk)
      return
    }
    if (typeof current !== 'object') return

    const label = normalizeText(current?.label ?? current?.text ?? current?.name)
    if (label && labelNormSet.has(label)) {
      candidates.push(current)
    }
    Object.values(current).forEach(walk)
  }
  walk(node)

  if (!candidates.length) return null
  if (!requireGaleria) return candidates[0]

  const withGaleria = candidates.find(c => Array.isArray(c?.galeria) || Object.prototype.hasOwnProperty.call(c || {}, 'galeria'))
  return withGaleria || candidates[0]
}

function findValueByKnownKeys(node, keyNormSet) {
  let found = ''

  const take = (value) => {
    if (found) return
    if (value === null || value === undefined) return
    const text = String(value).trim()
    if (text) found = text
  }

  const walk = (current) => {
    if (!current || found) return
    if (Array.isArray(current)) {
      current.forEach(walk)
      return
    }
    if (typeof current !== 'object') return

    for (const [key, value] of Object.entries(current)) {
      if (found) break
      if (keyNormSet.has(normalizeText(key))) {
        if (value && typeof value === 'object') take(getAttrRawValue(value))
        else take(value)
      }
      if (value && typeof value === 'object') walk(value)
    }
  }

  walk(node)
  return found
}

function getAttrRawValue(attr) {
  if (!attr || typeof attr !== 'object') return ''
  if (attr.default !== undefined && attr.default !== null && String(attr.default).trim() !== '') return attr.default
  if (attr.value !== undefined && attr.value !== null && String(attr.value).trim() !== '') return attr.value
  if (attr.values?.selected !== undefined && attr.values?.selected !== null && String(attr.values.selected).trim() !== '') return attr.values.selected
  if (attr.data !== undefined && attr.data !== null && String(attr.data).trim() !== '') return attr.data
  return ''
}

function parseGaleriaSafe(attr) {
  return Array.isArray(attr?.galeria) ? deepClone(attr.galeria) : []
}

function extractConexionEvidenciaFromBody(body) {
  const ATS_LABELS = ['ATS', 'Foto del tecnico en el ATS', 'Foto del técnico en el ATS', 'Registro Fotográfico ATS', 'Registro Fotografico ATS']
  const CHARLA_LABELS = ['Charla', 'Registro Fotográfico Charla', 'Registro Fotografico Charla']
  const ALTURA_LABELS = [
    'A. Altura',
    'T. Altura',
    'Foto A. Altura',
    'Registro Fotográfico T. Altura',
    'Registro Fotografico T. Altura',
    'Registro fotográfico check list trabajos en altura',
    'Registro fotografico check list trabajos en altura'
  ]
  const LLEGADA_LABELS = ['Registro Fotográfico Llegada al Domicilio', 'Registro Fotografico Llegada al Domicilio']
  const COMENTARIO_CHARLA_LABELS = ['Comentario Charla', 'Comentario de Charla', 'Observación Charla', 'Observacion Charla']
  const COMENTARIO_ATS_LABELS = ['Comentario ATS', 'Comentario de ATS', 'Observación ATS', 'Observacion ATS']
  const COMENTARIO_ALTURA_LABELS = ['Comentario T. Altura', 'Comentario A. Altura', 'Observación T. Altura', 'Observacion T. Altura']
  const HORA_LLEGADA_LABELS = ['Hora Llegada', 'Hora de Llegada', 'hora_llegada']

  const atsAttr = findBestAttrByLabels(body, new Set(ATS_LABELS.map(normalizeText)), { requireGaleria: true })
  const charlaAttr = findBestAttrByLabels(body, new Set(CHARLA_LABELS.map(normalizeText)), { requireGaleria: true })
  const alturaAttr = findBestAttrByLabels(body, new Set(ALTURA_LABELS.map(normalizeText)), { requireGaleria: true })
  const llegadaAttr = findAttrByLabels(body, new Set(LLEGADA_LABELS.map(normalizeText)))

  const comentarioCharlaAttr = findAttrByLabels(body, new Set(COMENTARIO_CHARLA_LABELS.map(normalizeText)))
  const comentarioAtsAttr = findAttrByLabels(body, new Set(COMENTARIO_ATS_LABELS.map(normalizeText)))
  const comentarioAlturaAttr = findAttrByLabels(body, new Set(COMENTARIO_ALTURA_LABELS.map(normalizeText)))
  const horaLlegadaAttr = findAttrByLabels(body, new Set(HORA_LLEGADA_LABELS.map(normalizeText)))

  return {
    atsFotos: parseGaleriaSafe(atsAttr),
    charlaFotos: parseGaleriaSafe(charlaAttr),
    alturaFotos: parseGaleriaSafe(alturaAttr),
    atsComentario: String(atsAttr?.obs ?? atsAttr?.observacion ?? getAttrRawValue(comentarioAtsAttr) ?? '').trim(),
    charlaComentario: String(charlaAttr?.obs ?? charlaAttr?.observacion ?? getAttrRawValue(comentarioCharlaAttr) ?? '').trim(),
    alturaComentario: String(alturaAttr?.obs ?? alturaAttr?.observacion ?? getAttrRawValue(comentarioAlturaAttr) ?? '').trim(),
    horaLlegada: String(llegadaAttr?.hora_llegada || getAttrRawValue(horaLlegadaAttr) || '').trim()
  }
}

function hasAnyChildEvidencia(data) {
  if (!data) return false
  return (
    (Array.isArray(data.atsFotos) && data.atsFotos.length > 0) ||
    (Array.isArray(data.charlaFotos) && data.charlaFotos.length > 0) ||
    (Array.isArray(data.alturaFotos) && data.alturaFotos.length > 0) ||
    String(data.atsComentario || '').trim() !== '' ||
    String(data.charlaComentario || '').trim() !== '' ||
    String(data.alturaComentario || '').trim() !== '' ||
    String(data.horaLlegada || '').trim() !== ''
  )
}

function getChildEvidenciaPreview(survey) {
  const id = Number(survey?.id_survey || 0)
  return id > 0 ? childEvidenciaByParent.value[id] || null : null
}

function sincronizarSoloATSPrueba({ parentBody, childBody }) {
  const ATS_SOURCE_LABELS = ['Registro Fotográfico ATS', 'Registro Fotografico ATS', 'Foto del tecnico en el ATS', 'Foto del técnico en el ATS', 'ATS']
  const ATS_TARGET_LABELS = ['ATS', 'Registro Fotográfico ATS', 'Registro Fotografico ATS', 'Foto del tecnico en el ATS', 'Foto del técnico en el ATS']

  const childAtsAttr = findBestAttrByLabels(childBody, new Set(ATS_SOURCE_LABELS.map(normalizeText)), { requireGaleria: true })
  const parentAtsAttr = findBestAttrByLabels(parentBody, new Set(ATS_TARGET_LABELS.map(normalizeText)))
  if (!childAtsAttr || !parentAtsAttr) return false

  let changed = false
  const childGaleria = Array.isArray(childAtsAttr?.galeria) ? deepClone(childAtsAttr.galeria) : []
  const childObs = String(childAtsAttr?.obs ?? childAtsAttr?.observacion ?? '').trim()

  if (JSON.stringify(parentAtsAttr.galeria || []) !== JSON.stringify(childGaleria)) {
    parentAtsAttr.galeria = childGaleria
    changed = true
  }
  if (String(parentAtsAttr.obs || '') !== childObs) {
    parentAtsAttr.obs = childObs
    changed = true
  }
  if (String(parentAtsAttr.observacion || '') !== childObs) {
    parentAtsAttr.observacion = childObs
    changed = true
  }
  if (childGaleria.length > 0) {
    if (setAttrSi(parentAtsAttr)) changed = true
  }
  return changed
}

const conexionHeaderDataCache = new Map()

function resolverNombreUsuario(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const numeric = Number(raw)
  if (!Number.isNaN(numeric) && nombresUsuariosById.value[numeric]) {
    return nombresUsuariosById.value[numeric]
  }
  return raw
}

function getConexionHeaderData(survey) {
  const cacheKey = `${Number(survey?.id_survey || 0)}|${JSON.stringify(surveyHeaderSnapshot.value || null)}|${JSON.stringify(survey?.body_exec ?? null)}|${JSON.stringify(linkedParentDetail.value?.body_exec ?? null)}|${survey?.fecha_plan_ini || ''}|${survey?.fecha_plan_fin || ''}`
  if (conexionHeaderDataCache.has(cacheKey)) return conexionHeaderDataCache.get(cacheKey)

  const bodyActual = parseBodyExecSafe(survey?.body_exec)
  const parentDetail = linkedParentDetail.value
  const bodyPadre = parseBodyExecSafe(parentDetail?.body_exec)
  const primarySources = [bodyActual, bodyPadre, survey, parentDetail]
  const parentPreferredSources = [bodyPadre, bodyActual, parentDetail, survey]

  const pickByLabels = (labels = [], keys = [], preferParent = false) => {
    const sources = preferParent ? parentPreferredSources : primarySources
    for (const src of sources) {
      if (!src || typeof src !== 'object') continue
      const attr = findAttrByLabels(src, new Set(labels.map(normalizeText)))
      const fromLabel = String(getAttrRawValue(attr) ?? '').trim()
      if (fromLabel) return fromLabel
      const fromKeys = findValueByKnownKeys(src, new Set(keys.map(normalizeText)))
      if (String(fromKeys || '').trim()) return fromKeys
    }
    return ''
  }

  const snap = surveyHeaderSnapshot.value || {}
  const fecha = (
    String(snap?.fecha || '').trim() ||
    pickByLabels(
      ['fecha asignacion', 'fecha asignación', 'fecha', 'fecha conexion', 'fecha conexión'],
      ['fecha_asignacion', 'fecha', 'fecha_plan_ini', 'fecha_plan_fin'],
      true
    ) ||
    survey?.fecha_plan_ini ||
    survey?.fecha_plan_fin ||
    '-'
  )
  const supTerracon = (
    String(snap?.sup_terracon || '').trim() ||
    pickByLabels(
      ['sup terracon', 'supervisor terracon', 'nombre supervisor terracon', 'supervisor', 'nombre supervisor'],
      ['sup_terracon', 'supervisor_terracon', 'id_user_supervisor', 'nombre_supervisor'],
      true
    ) ||
    resolverNombreUsuario(parentDetail?.id_user_supervisor) ||
    String(parentDetail?.nombre_supervisor || '').trim() ||
    resolverNombreUsuario(parentDetail?.id_user) ||
    String(parentDetail?.nombre_user || '').trim() ||
    resolverNombreUsuario(survey?.id_user) ||
    survey?.nombre_user ||
    '-'
  )
  const tipoTrabajo = (
    String(snap?.tipo || '').trim() ||
    pickByLabels(
      ['tipo empalme gasificar', 'tipo empalme/gasificar', 'tipo trabajo', 'tipo'],
      ['tipoempalmegasificar', 'tipo_empalme_gasificar', 'tipo_trabajo', 'tipo', 'tipo_conexion'],
      true
    ) ||
    String(parentDetail?.tipo_conexion || '').trim() ||
    String(survey?.tipo_conexion || '').trim() ||
    survey?.name_tipo_srv ||
    '-'
  )
  const tecnico = (
    pickByLabels(
      ['nombre tecnico', 'nombre técnico', 'tecnico', 'técnico', 'tecnico asignado'],
      ['nombre_tecnico', 'tecnico', 'tecnico_asignado', 'id_user_tecnico']
    ) ||
    resolverNombreUsuario(survey?.id_user_tecnico) ||
    survey?.nombre_user ||
    '-'
  )
  const orden = (() => {
    const candidates = [
      pickByLabels(['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden'], ['nmro_orden_mg', 'nro_orden', 'numero_orden', 'orden_trabajo'], true),
      pickByLabels(['numero orden', 'nro orden', 'n° orden', 'orden trabajo', 'n orden'], ['nmro_orden_mg', 'nro_orden', 'numero_orden', 'orden_trabajo'], false),
      String(parentDetail?.nmro_orden_mg || parentDetail?.nro_orden || parentDetail?.orden || '').trim(),
      String(survey?.nmro_orden_mg || survey?.nro_orden || survey?.orden || '').trim(),
      String(snap?.orden || '').trim(),
      pickByLabels(['ot', 'orden'], ['ot', 'orden'], true)
    ]
      .map(v => String(v || '').trim())
      .filter(v => v && v !== '-')

    const realOrden =
      candidates.find(v => /\d{5,}/.test(v)) ||
      candidates.find(v => !/^(?:ot\s*)?\d{1,3}$/i.test(v)) ||
      candidates[0]

    return realOrden || '-'
  })()
  const direccion = (
    String(snap?.direccion || '').trim() ||
    pickByLabels(['direccion', 'dirección', 'address', 'dir'], ['direccion', 'direccion_comuna'], true) ||
    String(parentDetail?.direccion_comuna || '').trim() ||
    String(parentDetail?.direccion || '').trim() ||
    survey?.direccion ||
    '-'
  )
  const comuna = (
    pickByLabels(['comuna'], ['comuna'], true) ||
    String(parentDetail?.comuna || '').trim() ||
    String(survey?.comuna || '').trim() ||
    ''
  )
  const direccionComuna = (() => {
    const dir = String(direccion || '').trim()
    const com = String(comuna || '').trim()
    if (!dir || dir === '-') return com || '-'
    if (!com) return dir
    if (dir.toLowerCase().includes(com.toLowerCase())) return dir
    return `${dir} / ${com}`
  })()
  const comunaDisplay = (() => {
    const com = String(comuna || '').trim()
    if (com) return com
    const parts = String(direccionComuna || '').split('/')
    return String(parts?.[parts.length - 1] || '').trim()
  })()
  const proyectoNombre = (
    String(survey?.nombre_proyecto || '').trim() ||
    String(parentDetail?.nombre_proyecto || '').trim() ||
    pickByLabels(
      ['nombre proyecto', 'proyecto', 'nombre_proyecto'],
      ['nombre_proyecto', 'proyecto', 'id_proyecto'],
      true
    ) ||
    '-'
  )
  const ic = (
    String(snap?.ic || '').trim() ||
    pickByLabels(['ic sap mg', 'ic_sap_mg', 'ic sap', 'ic-sap', 'ic_sap', 'ic'], ['ic_sap_mg', 'ic_sap', 'icsapmg', 'ic'], true) ||
    String(parentDetail?.ic_sap_mg || '').trim() ||
    String(parentDetail?.ic_sap || '').trim() ||
    survey?.ic_sap_mg ||
    survey?.ic_sap ||
    '-'
  )
  const supMetrogas = (
    String(snap?.sup_metrogas || '').trim() ||
    pickByLabels(
      ['gio', 'sup metrogas', 'supervisor metrogas', 'nombre supervisor metrogas', 'nombre certificador', 'certificador'],
      ['gio', 'sup_metrogas', 'supervisor_metrogas', 'certificador'],
      true
    ) ||
    String(parentDetail?.gio || '').trim() ||
    survey?.gio ||
    '-'
  )
  const numeroReclamo = (() => {
    const candidates = [
      pickByLabels(
        ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n° reclamo'],
        [],
        true
      ),
      pickByLabels(
        ['nmro reclamo', 'nro reclamo', 'numero reclamo', 'número reclamo', 'n° reclamo'],
        [],
        false
      ),
      String(parentDetail?.nro_reclamo || parentDetail?.numero_reclamo || '').trim(),
      String(survey?.nro_reclamo || survey?.numero_reclamo || '').trim()
    ]
      .map(v => String(v || '').trim())
      .filter(Boolean)

    const withRec = candidates.find(v => /rec/i.test(v))
    return withRec || '-'
  })()
  const statusSrv = String(parentDetail?.estado_srv || survey?.estado_srv || '').trim()
  const estadoRaw = (
    (statusSrv === 'Terminado' || statusSrv === 'APROBADO' || statusSrv === 'VERIFICACION')
      ? statusSrv
      : (pickByLabels(['estado'], ['estado'], true) || statusSrv || '-')
  )
  const estadoNorm = normalizeText(estadoRaw)
  const estado = estadoNorm.includes('solucionad')
    ? 'Solucionado'
    : estadoNorm.includes('pendient')
      ? 'Pendiente'
      : estadoRaw
  const observacionTerracon = (
    pickByLabels(
      [
        'observacion/descripcion del problema.',
        'observacion/descripcion del problema',
        'observación/descripción del problema.',
        'observacion descripcion del problema',
        'observacion terracon',
        'observación terracon'
      ],
      ['observacion', 'obs_terracon'],
      true
    ) ||
    '-'
  )
  const contenidoReclamo = (
    pickByLabels(
      ['contenido del reclamo', 'contenido reclamo'],
      ['contenido_reclamo', 'contenido'],
      true
    ) ||
    '-'
  )

  const result = {
    fecha,
    supTerracon: resolverNombreUsuario(supTerracon) || '-',
    tipoTrabajo,
    tecnico: resolverNombreUsuario(tecnico) || '-',
    orden,
    direccion: direccionComuna,
    comuna: comunaDisplay || '-',
    proyecto: proyectoNombre || '-',
    ic,
    supMetrogas: resolverNombreUsuario(supMetrogas) || '-',
    numeroReclamo,
    estado,
    observacionTerracon,
    contenidoReclamo
  }
  conexionHeaderDataCache.set(cacheKey, result)
  return result
}

function useCompactConexionHeader(survey) {
  return isConexionSurvey(survey)
}

async function obtenerParentIdSurvey(survey, id_survey) {
  const parentDirect = Number(survey?.id_survey_padre || 0)
  if (parentDirect > 0) return parentDirect

  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/procesosSurveyDetail', {
      params: { id_survey }
    })
    const detail = Array.isArray(data) ? data[0] : (data && typeof data === 'object' ? data : null)
    const parentId = Number(detail?.id_survey_padre || 0)
    return parentId > 0 ? parentId : 0
  } catch (error) {
    console.warn('[BHP] No se pudo obtener vínculo padre/hijo:', error?.response?.data || error?.message)
    return 0
  }
}

async function fetchSurveyDetailById(idSurvey) {
  const id = Number(idSurvey || 0)
  if (!id) return null
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/procesosSurveyDetail', {
      params: { id_survey: id }
    })
    return extractSurveyDetail(data)
  } catch (error) {
    console.warn('[BHP] No se pudo obtener detalle de survey por id:', id, error?.response?.data || error?.message)
    return null
  }
}

async function obtenerHijoConexionDetalleDesdePadre(parentId, parentSurvey = null) {
  try {
    const candidateIds = new Set()

    const fromSession = Number(sessionStorage.getItem(`cnx_child_${Number(parentId || 0)}`) || 0)
    if (fromSession > 0) candidateIds.add(fromSession)

    const fromParentSurvey = Number(parentSurvey?.id_survey_hijo || parentSurvey?.id_child_survey || 0)
    if (fromParentSurvey > 0) candidateIds.add(fromParentSurvey)

    if (!candidateIds.size) {
      const { data } = await apiAxios.get('/servicio/leanglobal/procesosSurveyV3')
      const rows = Array.isArray(data?.datos) ? data.datos : []
      const hijos = rows
        .filter((r) => Number(r?.id_survey_padre || 0) === Number(parentId || 0) && isConexionSurvey(r))
        .sort((a, b) => Number(b?.id_survey || 0) - Number(a?.id_survey || 0))
      for (const h of hijos) {
        const childId = Number(h?.id_survey || 0)
        if (childId > 0) candidateIds.add(childId)
      }
    }

    for (const childId of candidateIds) {
      const childDetail = await fetchSurveyDetailById(childId)
      if (childDetail) return childDetail
    }

    return null
  } catch (error) {
    console.warn('[BHP] No se pudo obtener survey hijo de conexión:', error?.response?.data || error?.message)
    return null
  }
}

function setAttrSi(attr) {
  if (!attr || typeof attr !== 'object') return false
  let changed = false
  if (attr.default !== 'si') {
    attr.default = 'si'
    changed = true
  }
  if (attr.value !== undefined && attr.value !== 'si') {
    attr.value = 'si'
    changed = true
  }
  if (attr.respuesta !== undefined && attr.respuesta !== 'si') {
    attr.respuesta = 'si'
    changed = true
  }
  if (attr.values && typeof attr.values === 'object' && attr.values.selected !== undefined && attr.values.selected !== 'si') {
    attr.values.selected = 'si'
    changed = true
  }
  return changed
}

function setAttrTextValue(attr, text) {
  if (!attr || typeof attr !== 'object') return false
  const next = String(text ?? '').trim()
  let changed = false
  if (attr.default !== undefined && String(attr.default ?? '') !== next) {
    attr.default = next
    changed = true
  }
  if (attr.value !== undefined && String(attr.value ?? '') !== next) {
    attr.value = next
    changed = true
  }
  if (attr.respuesta !== undefined && String(attr.respuesta ?? '') !== next) {
    attr.respuesta = next
    changed = true
  }
  if (attr.obs !== undefined && String(attr.obs ?? '') !== next) {
    attr.obs = next
    changed = true
  }
  if (attr.observacion !== undefined && String(attr.observacion ?? '') !== next) {
    attr.observacion = next
    changed = true
  }
  return changed
}

function normalizeHoraLlegadaForDatetime(value, surveyRef) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return raw
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(raw)) return raw.replace(' ', 'T')

  if (/^\d{2}:\d{2}$/.test(raw)) {
    const baseDate = String(surveyRef?.fecha_plan_ini || DateTime.now().setZone('America/Santiago').toFormat('yyyy-LL-dd'))
      .slice(0, 10)
    return `${baseDate}T${raw}`
  }

  return raw
}

function syncEvidenciaAttr(parentAttr, childAttr) {
  if (!parentAttr || !childAttr) return false
  let changed = false

  if ('galeria' in parentAttr || Array.isArray(childAttr?.galeria)) {
    const nextGaleria = Array.isArray(childAttr?.galeria) ? deepClone(childAttr.galeria) : []
    if (JSON.stringify(parentAttr.galeria || []) !== JSON.stringify(nextGaleria)) {
      parentAttr.galeria = nextGaleria
      changed = true
    }
  }

  const obsChild = (childAttr?.obs ?? childAttr?.observacion ?? '').toString()
  if ('obs' in parentAttr && String(parentAttr.obs ?? '') !== obsChild) {
    parentAttr.obs = obsChild
    changed = true
  }
  if ('observacion' in parentAttr && String(parentAttr.observacion ?? '') !== obsChild) {
    parentAttr.observacion = obsChild
    changed = true
  }

  if (childAttr?.default !== undefined && parentAttr?.default !== undefined && parentAttr.default !== childAttr.default) {
    parentAttr.default = childAttr.default
    changed = true
  }
  if (childAttr?.value !== undefined && parentAttr?.value !== undefined && parentAttr.value !== childAttr.value) {
    parentAttr.value = childAttr.value
    changed = true
  }
  if (childAttr?.respuesta !== undefined && parentAttr?.respuesta !== undefined && parentAttr.respuesta !== childAttr.respuesta) {
    parentAttr.respuesta = childAttr.respuesta
    changed = true
  }
  if (
    childAttr?.hora_llegada !== undefined &&
    String(childAttr?.hora_llegada || '').trim() &&
    parentAttr?.hora_llegada !== childAttr.hora_llegada
  ) {
    parentAttr.hora_llegada = childAttr.hora_llegada
    changed = true
  }

  return changed
}

function sincronizarEvidenciasBodyConexion({ parentBody, childBody }) {
  const ATS_SOURCE_LABELS = ['ATS', 'Foto del tecnico en el ATS', 'Foto del técnico en el ATS', 'Registro Fotográfico ATS', 'Registro Fotografico ATS']
  const CHARLA_SOURCE_LABELS = ['Charla', 'Registro Fotográfico Charla', 'Registro Fotografico Charla']
  const ALTURA_SOURCE_LABELS = [
    'A. Altura',
    'T. Altura',
    'Foto A. Altura',
    'Registro Fotográfico T. Altura',
    'Registro Fotografico T. Altura',
    'Registro fotográfico check list trabajos en altura',
    'Registro fotografico check list trabajos en altura'
  ]
  const LLEGADA_SOURCE_LABELS = ['Registro Fotográfico Llegada al Domicilio', 'Registro Fotografico Llegada al Domicilio']

  const ATS_TARGET_LABELS = ['ATS', 'Foto del tecnico en el ATS', 'Foto del técnico en el ATS', 'Registro Fotográfico ATS', 'Registro Fotografico ATS']
  const CHARLA_TARGET_LABELS = ['Charla', 'Registro Fotográfico Charla', 'Registro Fotografico Charla']
  const ALTURA_TARGET_LABELS = ['T. Altura', 'A. Altura', 'Registro Fotográfico T. Altura', 'Registro Fotografico T. Altura', 'Foto A. Altura']
  const LLEGADA_TARGET_LABELS = ['Registro Fotográfico Llegada al Domicilio', 'Registro Fotografico Llegada al Domicilio']

  const CHECK_ATS_LABELS = ['ATS']
  const CHECK_CHARLA_LABELS = ['Charla']
  const CHECK_ALTURA_LABELS = ['T. Altura', 'A. Altura']
  const HORA_LLEGADA_LABELS = ['Hora Llegada', 'Hora de Llegada', 'hora_llegada']
  const COMENTARIO_CHARLA_LABELS = ['Comentario Charla', 'Comentario de Charla', 'Observación Charla', 'Observacion Charla']
  const COMENTARIO_ATS_LABELS = ['Comentario ATS', 'Comentario de ATS', 'Observación ATS', 'Observacion ATS']

  const childAtsAttr = findBestAttrByLabels(childBody, new Set(ATS_SOURCE_LABELS.map(normalizeText)), { requireGaleria: true })
  const childCharlaAttr = findBestAttrByLabels(childBody, new Set(CHARLA_SOURCE_LABELS.map(normalizeText)), { requireGaleria: true })
  const childAlturaAttr = findBestAttrByLabels(childBody, new Set(ALTURA_SOURCE_LABELS.map(normalizeText)), { requireGaleria: true })
  const childLlegadaAttr = findAttrByLabels(childBody, new Set(LLEGADA_SOURCE_LABELS.map(normalizeText)))
  const childComentarioCharlaAttr = findAttrByLabels(childBody, new Set(COMENTARIO_CHARLA_LABELS.map(normalizeText)))
  const childComentarioAtsAttr = findAttrByLabels(childBody, new Set(COMENTARIO_ATS_LABELS.map(normalizeText)))

  if (!childAtsAttr && !childCharlaAttr && !childAlturaAttr && !childLlegadaAttr) {
    return false
  }

  const parentAtsAttr = findBestAttrByLabels(parentBody, new Set(ATS_TARGET_LABELS.map(normalizeText)), { requireGaleria: true })
  const parentCharlaAttr = findBestAttrByLabels(parentBody, new Set(CHARLA_TARGET_LABELS.map(normalizeText)), { requireGaleria: true })
  const parentAlturaAttr = findBestAttrByLabels(parentBody, new Set(ALTURA_TARGET_LABELS.map(normalizeText)), { requireGaleria: true })
  const parentLlegadaAttr = findAttrByLabels(parentBody, new Set(LLEGADA_TARGET_LABELS.map(normalizeText)))
  const parentCheckAts = findAttrByLabels(parentBody, new Set(CHECK_ATS_LABELS.map(normalizeText)))
  const parentCheckCharla = findAttrByLabels(parentBody, new Set(CHECK_CHARLA_LABELS.map(normalizeText)))
  const parentCheckAltura = findAttrByLabels(parentBody, new Set(CHECK_ALTURA_LABELS.map(normalizeText)))
  const parentHoraLlegada = findAttrByLabels(parentBody, new Set(HORA_LLEGADA_LABELS.map(normalizeText)))
  const parentComentarioCharlaAttr = findAttrByLabels(parentBody, new Set(COMENTARIO_CHARLA_LABELS.map(normalizeText)))
  const parentComentarioAtsAttr = findAttrByLabels(parentBody, new Set(COMENTARIO_ATS_LABELS.map(normalizeText)))

  let updated = false

  if (syncEvidenciaAttr(parentAtsAttr, childAtsAttr)) updated = true
  if (syncEvidenciaAttr(parentCharlaAttr, childCharlaAttr)) updated = true
  if (syncEvidenciaAttr(parentAlturaAttr, childAlturaAttr)) updated = true
  if (syncEvidenciaAttr(parentLlegadaAttr, childLlegadaAttr)) updated = true

  const setSiIfHasPhotos = (childAttr, parentCheckAttr) => {
    if (!childAttr || !parentCheckAttr) return false
    if (Array.isArray(childAttr?.galeria) && childAttr.galeria.length > 0) {
      return setAttrSi(parentCheckAttr)
    }
    return false
  }

  if (setSiIfHasPhotos(childAtsAttr, parentCheckAts)) updated = true
  if (setSiIfHasPhotos(childCharlaAttr, parentCheckCharla)) updated = true
  if (setSiIfHasPhotos(childAlturaAttr, parentCheckAltura)) updated = true

  const comentarioCharla = String(
    childCharlaAttr?.obs ??
    childCharlaAttr?.observacion ??
    getAttrRawValue(childComentarioCharlaAttr) ??
    ''
  ).trim()
  const comentarioAts = String(
    childAtsAttr?.obs ??
    childAtsAttr?.observacion ??
    getAttrRawValue(childComentarioAtsAttr) ??
    ''
  ).trim()

  if (comentarioCharla) {
    if (parentCharlaAttr && setAttrTextValue(parentCharlaAttr, comentarioCharla)) updated = true
    if (parentComentarioCharlaAttr && setAttrTextValue(parentComentarioCharlaAttr, comentarioCharla)) updated = true
  }
  if (comentarioAts) {
    if (parentAtsAttr && setAttrTextValue(parentAtsAttr, comentarioAts)) updated = true
    if (parentComentarioAtsAttr && setAttrTextValue(parentComentarioAtsAttr, comentarioAts)) updated = true
  }

  const horaLlegada = String(childLlegadaAttr?.hora_llegada || '').trim()
  if (horaLlegada && parentHoraLlegada) {
    const horaNormalizada = normalizeHoraLlegadaForDatetime(horaLlegada, surveyDetailStore.surveyDetail?.[0])
    if (parentHoraLlegada.hora_llegada !== undefined && parentHoraLlegada.hora_llegada !== horaLlegada) {
      parentHoraLlegada.hora_llegada = horaLlegada
      updated = true
    }
    if (parentHoraLlegada.default !== undefined && parentHoraLlegada.default !== horaNormalizada) {
      parentHoraLlegada.default = horaNormalizada
      updated = true
    }
    if (parentHoraLlegada.value !== undefined && parentHoraLlegada.value !== horaNormalizada) {
      parentHoraLlegada.value = horaNormalizada
      updated = true
    }
    if (parentHoraLlegada.respuesta !== undefined && parentHoraLlegada.respuesta !== horaNormalizada) {
      parentHoraLlegada.respuesta = horaNormalizada
      updated = true
    }
  }

  return updated
}

async function sincronizarConexionTemplate110DesdeHijoAlAbrir() {
  const surveyActual = surveyDetailStore.surveyDetail?.[0]
  if (!surveyActual) return
  if (!isConexionSurvey(surveyActual)) return
  if (Number(surveyActual?.id_survey_padre || 0) > 0) return // solo cuando abrimos el padre
  if (!navigator.onLine) return

  const parentId = Number(surveyActual?.id_survey || 0)
  if (parentId <= 0) return

  const childDetail = await obtenerHijoConexionDetalleDesdePadre(parentId, surveyActual)
  if (!childDetail) return

  const childBody = parseBodyExecSafe(childDetail?.body_exec)
  const evidenciaHijo = extractConexionEvidenciaFromBody(childBody)
  if (hasAnyChildEvidencia(evidenciaHijo)) {
    childEvidenciaByParent.value = {
      ...childEvidenciaByParent.value,
      [parentId]: evidenciaHijo
    }
  }

  const parentBody = parseBodyExecSafe(surveyActual?.body_exec)
  const updatedSoloAts = sincronizarSoloATSPrueba({ parentBody, childBody })
  const updated = sincronizarEvidenciasBodyConexion({ parentBody, childBody })
  if (!updated && !updatedSoloAts) return

  surveyActual.body_exec = parentBody
  const estadoParentSync = resolveEstadoSrvForSave(surveyActual)
  surveyActual.estado_srv = estadoParentSync

  const payload = {
    estado_srv: estadoParentSync,
    body_exec: JSON.stringify(stripBase64FromBodyExec(parentBody)),
    fecha_real_ini: surveyActual?.fecha_real_ini || DateTime.now().setZone('America/Santiago').toFormat('yyyy-LL-dd HH:mm:ss'),
    fecha_ejec_fin: surveyActual?.fecha_ejec_fin ?? null,
    latitud: surveyActual?.latitud ?? null,
    longitud: surveyActual?.longitud ?? null
  }
  await apiAxios.put(`/survey/${parentId}`, payload)
}

async function sincronizarFotosConexionEnPadreAlGuardar({ survey, id_survey, offlineQueued = false }) {
  if (!isConexionSurvey(survey)) return
  if (offlineQueued || !navigator.onLine) return

  const parentId = await obtenerParentIdSurvey(survey, id_survey)
  if (parentId <= 0) return // no es hijo

  const childBody = parseBodyExecSafe(survey?.body_exec)

  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/procesosSurveyDetail', {
      params: { id_survey: parentId }
    })
    const parentDetail = Array.isArray(data) ? data[0] : (data && typeof data === 'object' ? data : null)
    if (!parentDetail) return

    const parentBody = parseBodyExecSafe(parentDetail?.body_exec)
    const updated = sincronizarEvidenciasBodyConexion({ parentBody, childBody })

    if (!updated) return
    const parentSurveySync = { ...parentDetail, body_exec: parentBody }
    const estadoParentSync = resolveEstadoSrvForSave(parentSurveySync)

    const parentPayload = {
      estado_srv: estadoParentSync,
      body_exec: JSON.stringify(stripBase64FromBodyExec(parentBody)),
      fecha_real_ini: parentDetail?.fecha_real_ini || DateTime.now().setZone('America/Santiago').toFormat('yyyy-LL-dd HH:mm:ss'),
      fecha_ejec_fin: parentDetail?.fecha_ejec_fin ?? null,
      latitud: parentDetail?.latitud ?? null,
      longitud: parentDetail?.longitud ?? null
    }

    await apiAxios.put(`/survey/${parentId}`, parentPayload)
    console.log('[BHP] Evidencias ATS/Charla/A. Altura y hora_llegada sincronizadas en survey padre:', parentId)
  } catch (error) {
    console.warn('[BHP] No se pudo sincronizar fotos al survey padre:', error?.response?.data || error?.message)
  }
}

async function enviarCorreoResponsableGestionAlGuardar({ survey, id_survey, offlineQueued = false }) {
  if (Number(survey?.id_template) !== TEMPLATE_ID_RESPONSABLE_GESTION) return

  const email = getResponsableGestionEmailFromSurvey(survey)
  if (!email) return

  if (!isValidEmail(email)) {
    console.warn('[BHP] Nombre Responsable de Gestión no es un correo válido:', email)
    return
  }

  // Si el guardado quedó en cola offline, no intentamos notificar todavía.
  if (offlineQueued || !navigator.onLine) {
    console.log('[BHP] Correo Responsable de Gestión omitido por modo offline/cola:', email)
    return
  }

  try {
    await apiAxios.post('/servicio/leanglobal/notificar-responsable-gestion', {
      id_survey,
      id_template: survey?.id_template,
      email_responsable_gestion: email,
      nombre_responsable_gestion: email
    })
    console.log('[BHP] Correo Responsable de Gestión enviado a:', email)
  } catch (error) {
    // No bloquea guardado/flujo; endpoint se implementará en lean-services.
    console.warn('[BHP] No se pudo enviar correo Responsable de Gestión:', error?.response?.data || error?.message)
  }
}

function stripBase64FromBodyExec(body) {
  const cloned = JSON.parse(JSON.stringify(body))

  const walk = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(walk)

    // Si hay galerías: borra base64
    if (Array.isArray(node.galeria)) {
      node.galeria = node.galeria.map(f => ({
        base64: '',                  // ✅ fuera
        url: f?.url || '',
        nombre: f?.nombre || ''
      }))
    }

    // Por si viene base64 suelto
    if (typeof node.base64 === 'string' && node.base64.startsWith('data:image')) {
      node.base64 = ''              // ✅ fuera
    }

    Object.values(node).forEach(walk)
  }

  walk(cloned)
  return cloned
}

async function putSurvey(id_survey) {
  const survey = surveyDetailStore.surveyDetail[0]
  normalizeSurveyBodyExecFromDb(survey)
  getSegmentos(survey)
  normalizeComunicacionRadialBeforeSave(survey.body_exec)

  const coordenadas = obtenerCoordenadas(survey)
  const estadoSrv = resolveEstadoSrvForSave(survey)
  survey.estado_srv = estadoSrv
  const bodyExecToSave = deepClone(survey.body_exec || {})
  const estadoNorm = normalizeText(estadoSrv)
  if (isConexionSurvey(survey) && estadoNorm.includes('levantamiento') && estadoNorm.includes('reclamo')) {
    integrarOrdenEnBodyExecParaReclamo(bodyExecToSave, getOrdenAsignacionActual(survey))
  }
  normalizeComunicacionRadialBeforeSave(bodyExecToSave)
  const bodyLimpio = stripBase64FromBodyExec(bodyExecToSave)
  const bodyExecString = JSON.stringify(bodyLimpio)

  console.log(id_survey)
  console.log('[Survey save] body_exec enviado:', bodyExecString)

  const payload = {
    estado_srv: estadoSrv,
    body_exec: bodyExecString,
    fecha_real_ini: DateTime.now()
      .setZone('America/Santiago')
      .toFormat('yyyy-LL-dd HH:mm:ss'),
    fecha_ejec_fin: null,
    latitud: coordenadas?.lat ?? null,
    longitud: coordenadas?.lng ?? null
  }

  // 👉 Solo queremos nivel 3 OFFLINE para INSPECCIONES, no PPD
  const esPPD = isPPDTemplate(survey)

  try {
    if (esPPD) {
      // 🔸 PPD: siempre ONLINE (sin cola)
      const response = await apiAxios.put(
        `/survey/${id_survey}`,
        payload
      )
      console.log('Survey PPD actualizado correctamente:', response.data)
      await sincronizarFotosConexionEnPadreAlGuardar({
        survey,
        id_survey,
        offlineQueued: false
      })
      await enviarCorreoResponsableGestionAlGuardar({
        survey,
        id_survey,
        offlineQueued: false
      })
      return {
        ok: true,
        offlineQueued: false,
        data: response.data
      }
    } else {
      // 🟢 INSPECCIÓN: usa cola offline (nivel 3)
      let resp
      if (navigator.onLine) {
        const formData = new FormData()
        formData.append('estado_srv', estadoSrv)
        formData.append('body_exec', bodyExecString)
        formData.append('fecha_real_ini', payload.fecha_real_ini)
        formData.append('fecha_ejec_fin', '')
        formData.append('latitud', coordenadas?.lat ?? '')
        formData.append('longitud', coordenadas?.lng ?? '')

        resp = await apiAxios.put(`/survey/${id_survey}`, formData)
      } else {
        resp = await enviarOACola(
          {
            method: 'put',
            url: `/survey/${id_survey}`,
            data: payload
          },
          {
            tipo: 'GUARDAR_EJECUCION',
            id_survey
          }
        )
      }

      const offlineQueued = !!resp?.data?.offlineQueued
      console.log(
        'Protocolo inspección actualizado (offlineQueued =',
        offlineQueued,
        '):',
        resp.data
      )
      await enviarCorreoResponsableGestionAlGuardar({
        survey,
        id_survey,
        offlineQueued
      })
      await sincronizarFotosConexionEnPadreAlGuardar({
        survey,
        id_survey,
        offlineQueued
      })

      return {
        ok: true,
        offlineQueued,
        data: resp.data
      }
    }
  } catch (error) {
    console.error('Error al actualizar protocolo:', error)
    return {
      ok: false,
      error
    }
  }
}

const local = ref({ lat: null, lng: null });

function confirmarTerminarSurvey() {
  dialogConfirmarTerminar.value = true;
}

function handleResultadoAceptar() {
  dialogResultado.value = false;
}

// 3) MODIFICADO: validar antes de terminar
async function handleTerminarSurvey() {
  // si faltan fotos, NO seguimos
  if (!validarFotosRequeridas()) {
    return
  }

  if (!validarMatrizCheckRequerida()) {
    return
  }

  if (!validarCampos()) {
    const faltantes = Object.values(errores.value).flat().map(e => `• ${e.label || e.tipo || 'Campo sin nombre'}`);
    const proceed = confirm('Faltan rellenar campos obligatorios:\n\n' + faltantes.join('\n') + '\n\n¿Deseas continuar a firma de todas formas? (Bypass de desarrollo/pruebas)');
    if (!proceed) return;
  }

  // ⚠️ IMPORTANTE: pasar a flujo / exportar SOLO ONLINE
  if (!navigator.onLine) {
    dialogConfirmarTerminar.value = false
    alert('Para pasar la Inspección a Flujo de Aprobación necesitas conexión a internet. Puedes guardar los cambios offline con el botón "Guardar".')
    return
  }

  dialogConfirmarTerminar.value = false
  dialogLoading.value = true

  try {
    const current = surveyDetailStore.surveyDetail[0]

    // Si es modo superior activo, inyectar el gpsCierre de forma automática
    if (isSuperiorModeActive.value) {
      await obtenerUbicacion()
      surveyDetailStore.surveyDetail.forEach(survey => {
        const segmentos = getSegmentos(survey)
        ;(segmentos || []).forEach(seg => {
          ;(seg.attributes || []).forEach(attr => {
            if (attr.type === 'checkListObservacionConductual') {
              if (!attr.datos) attr.datos = {}
              attr.datos.gpsCierre = {
                lat: local.value.lat || null,
                lng: local.value.lng || null
              }
            } else if (attr.type === 'condicionesSeguridadTrabajo') {
              attr.gpsCierre = {
                lat: local.value.lat || null,
                lng: local.value.lng || null
              }
            }
          })
        })
      })
    }

    // 1) Guardar body_exec (usa cola, pero en este caso hay internet)
    const result = await putSurvey(current.id_survey)
    if (!result || result.ok === false) {
      dialogLoading.value = false
      alert('Error al guardar antes de proceder.')
      return
    }

    // Si el usuario es el superior derivado en modo de cierre:
    if (isSuperiorModeActive.value) {
      dialogLoading.value = false
      // Redirigir de inmediato al menú de firmas abriendo en caliente la firma para esta encuesta
      router.push({
        path: '/firmas',
        query: { id_survey: current.id_survey }
      })
      return
    }

    // 2) Terminar y pasar a VERIFICACION + exportar (composable)
    await terminarSurveyYExportar(current.id_survey)

    dialogLoading.value = false
    const idTemplate = Number(surveyDetailStore.surveyDetail[0].id_template)
    if (isTemplate101.value || [70, 80].includes(idTemplate)) {
      router.push({
        path: '/firmas',
        query: { id_survey: surveyDetailStore.surveyDetail[0].id_survey }
      })
    } else {
      dialogResultado.value = true
    }
  } catch (error) {
    dialogLoading.value = false
    console.error('Error al terminar survey:', error)
    alert('Error al pasar a flujo de aprobación.')
  }
}

async function putSurveyFechaEjecFin(id_survey) {
  await putSurvey(surveyDetailStore.surveyDetail[0].id_survey);
  const formData = new FormData();
  await obtenerUbicacion();

  const localCL = DateTime
    .fromISO(DateTime.now().toISO())           // o desde tu valor
    .setZone('America/Santiago')
    .toSQL({ includeOffset: false })

  formData.append('estado_srv', 'VERIFICACION');
  formData.append('body_exec', normalizeBodyExec(surveyDetailStore.surveyDetail[0].body_exec));
  formData.append('fecha_real_ini', surveyDetailStore.surveyDetail[0].fecha_plan_ini || DateTime.now().setZone('America/Santiago').toISO());
  //formData.append('fecha_ejec_fin', DateTime.now().setZone('America/Santiago').toISO());
  formData.append('fecha_ejec_fin', localCL)
  formData.append('latitud', local.value.lat || '');
  formData.append('longitud', local.value.lng || '');

  console.log('FD:', Array.from(formData.entries()));

  try {
    const response = await apiAxios.put(`/survey/UpdFechaEjecFin/${id_survey}`, formData);

    await exportarInspeccion(id_survey);
    console.log('Survey actualizado correctamente:', response.data);
  } catch (error) {
    console.error('Error al actualizar survey:', error);
  }

}

/*async function putSurveyFechaEjecFin(id_survey) {
  const formData = new FormData();

  //const coordenadas = obtenerCoordenadas(surveyDetailStore.surveyDetail[0]);

  await obtenerUbicacion()

  console.log("id_survey", id_survey);
  //console.log(JSON.stringify(surveyDetailStore.surveyDetail[0].body_exec));
  console.log("surveyDetailStore", surveyDetailStore.surveyDetail[0]);

  formData.append('estado_srv', 'VERIFICACION');
  formData.append('body_exec', JSON.stringify(surveyDetailStore.surveyDetail[0].body_exec));
  formData.append('fecha_real_ini', surveyDetailStore.surveyDetail[0].fecha_plan_ini ?? DateTime.now().setZone('America/Santiago').toFormat("yyyy-MM-dd'T'HH:mm:ss"));
  formData.append('fecha_ejec_fin', DateTime.now().setZone('America/Santiago').toFormat("yyyy-MM-dd'T'HH:mm:ss"));
  // Si coordenadas existen, usa lat/lng, si no, manda null o vacío
  formData.append('latitud', local.value.lat ?? '');
  formData.append('longitud', local.value.lng ?? '');
  for (let pair of formData.entries()) {
    console.log(pair[0]+ ': ' + pair[1]);
  }

  try {
    const response = await apiAxios.put(/survey/${id_survey}, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    await exportarInspeccion(id_survey);
    console.log('Survey actualizado correctamente:', response.data);
  } catch (error) {
    console.error('Error al actualizar survey:', error);
  }

}*/


async function obtenerUbicacion() {
  return new Promise((resolve, reject) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          local.value.lat = pos.coords.latitude;
          local.value.lng = pos.coords.longitude;
          console.log('✅ Coordenadas obtenidas:', local.value);
          resolve();
        },
        (err) => {
          console.error('❌ Error al obtener ubicación:', err.message);
          // puedes poner valores por defecto o null
          local.value.lat = '';
          local.value.lng = '';
          resolve();  // resolvemos igual para que el flujo siga
        }
      )
    } else {
      console.warn('⚠️ Geolocalización no soportada en este navegador.');
      local.value.lat = '';
      local.value.lng = '';
      resolve();
    }
  });
}

const exportarInspeccion = async (idInspeccion) => {
  const formData = new FormData()
  //formData.append('archivo', file)
  formData.append('idInspeccion', idInspeccion);
  formData.append('tipo_doc', 'DOCUMENTO')
  formData.append('mimetype', 'application/pdf');
  formData.append('name_doc_orig', '')
  formData.append('name_doc_interno', '')
  formData.append('tenant_code', 'transmac')
  formData.append('modulo', 'inspecciones')
  formData.append('id_user', userDetailStore.userDetail.id_user)
  formData.append('estado', '1')
  try {
    const response = await apiAxios.post(
      `/exportar/generar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
    );

    console.log('✅ Exportación exitosa:', response.data);
    // Podrías mostrar al usuario:
    //alert(`PDF generado: ${response.data.archivo}`);
  } catch (error) {
    console.error('❌ Error al exportar:', error.response?.data || error.message);
    alert('Error al exportar');
  }
};

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
    const attrObs = (segmento.attributes || []).find(attr => attr.type === 'checkListObservacionConductual');
    if (attrObs && attrObs.datos && attrObs.datos.gps && attrObs.datos.gps.lat && attrObs.datos.gps.lng) {
      return {
        lat: attrObs.datos.gps.lat,
        lng: attrObs.datos.gps.lng
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
      const attrs = Array.isArray(segmento.attributes) ? segmento.attributes : [];
      const hasMatrizCheckSegment = attrs.some((a) => a?.type === 'matrizCheck');

      segmento.attributes?.forEach((attr, idxAttr) => {
        if (hasMatrizCheckSegment && attr.type !== 'matrizCheck') return;
        if (attr.type !== 'matrizCheck' && attr.nullable !== false) return;

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

          case 'checkListObservacionConductual':
            valor = isObservacionConductualComplete(attr);
            break;

          case 'condicionesSeguridadTrabajo':
            valor = isCondicionesSeguridadComplete(attr);
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

          case 'ingresoZanja':
            valor = Array.isArray(attr.body) && attr.body.length > 0;
            break;

          case 'chequeoExtensionElectrica': {
            const blocks = Array.isArray(attr.body) ? attr.body : [];
            valor = blocks.length > 0 && blocks.every((b) => {
              if (!b?.numero) return false;
              const estado = (b?.estado ?? '').toString().trim().toLowerCase();
              return estado === 'aprobado' || estado === 'rechazado';
            });
            break;
          }

          case 'checkMonofasicoTrifasico': {
            const rows = Array.isArray(attr.body) ? attr.body : [];
            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            valor = rows.length > 0 && rows.some((row) => {
              const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
              const hasObs = (row?.observaciones ?? '').toString().trim() !== '';
              return hasDay || hasObs;
            });
            break;
          }

          case 'vibropison': {
            const rows = Array.isArray(attr.body) ? attr.body : [];
            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            const hasData = rows.length > 0 && rows.some((row) => {
              const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
              const hasObs = (row?.observacion ?? '').toString().trim() !== '';
              return hasDay || hasObs;
            });
            const estado = (attr?.estado ?? '').toString().trim().toLowerCase();
            valor = hasData && (estado === 'aprobada' || estado === 'reprobada');
            break;
          }

          case 'chequeoSeguridadBetonera': {
            const rows = Array.isArray(attr.body) ? attr.body : [];
            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            const hasData = rows.length > 0 && rows.some((row) => {
              const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
              const hasObs = (row?.observacion ?? '').toString().trim() !== '';
              return hasDay || hasObs;
            });
            const estado = (attr?.estado ?? '').toString().trim().toLowerCase();
            valor = hasData && (estado === 'aprobada' || estado === 'reprobada');
            break;
          }

          case 'checkeoMartilloDemoledor': {
            const rows = Array.isArray(attr.body) ? attr.body : [];
            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            const hasData = rows.length > 0 && rows.some((row) => {
              const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
              const hasObs = (row?.observacion ?? '').toString().trim() !== '';
              return hasDay || hasObs;
            });
            const estado = (attr?.estado ?? '').toString().trim().toLowerCase();
            valor = hasData && (estado === 'aprobada' || estado === 'reprobada');
            break;
          }

          case 'checkEquiposIluminacion': {
            const rows = (Array.isArray(attr.body) ? attr.body : [])
              .filter((row) => row?.kind !== 'group');
            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            valor = rows.length > 0 && rows.some((row) => {
              const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
              const hasObs = dayKeys.some((k) => ((row?.obsByDay?.[k] ?? row?.obs ?? '').toString().trim() !== ''));
              return hasDay || hasObs;
            });
            break;
          }

          case 'checkDispensadorAguaPotable': {
            const rows = Array.isArray(attr.body) ? attr.body : [];
            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            const activeRows = rows.filter((row) => dayKeys.some((k) => Boolean(row?.days?.[k])));
            const hasData = activeRows.length > 0;
            const perRowComplete = activeRows.every((row) => {
              const hasResponsable = (row?.responsable ?? '').toString().trim() !== '' || !!row?.responsableId;
              const hasFecha = (row?.fecha ?? '').toString().trim() !== '';
              return hasResponsable && hasFecha;
            });
            valor = hasData && perRowComplete;
            break;
          }

          case 'checkListHerramientasManuales':
          case 'checklistHerramientasManuales':
          case 'CHECK LIST HERRAMIENTAS MANUALES': {
            const rows = (Array.isArray(attr.body) ? attr.body : [])
              .filter((row) => row?.kind === 'item');
            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            valor = rows.length > 0 && rows.some((row) => {
              const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
              const hasObs = (row?.observacion ?? '').toString().trim() !== '';
              return hasDay || hasObs;
            });
            break;
          }

          case 'checkListComunicacionRadial':
          case 'checklistComunicacionRadial':
          case 'checkListComunicacionRadialDmh':
          case 'checklistComunicacionRadialDmh':
          case 'checkListSpotComunicacionRadialCodelco':
          case 'CHECK LIST COMUNICACION RADIAL':
          case 'CHECK LIST COMUNICACIÓN RADIAL':
          case 'FOR-SGI-CDMH-01-SST-012 CHECK LIST DE COMUNICACION RADIAL':
          case 'FOR-SGI-CDMH-01-SST-012 CHECK LIST DE COMUNICACIÓN RADIAL': {
            const rows = (Array.isArray(attr.body) ? attr.body : [])
              .filter((row) => row?.kind !== 'group');
            const dayKeys = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'];
            const hasAnswers = rows.length > 0 && rows.some((row) =>
              dayKeys.some((k) => ['si', 'no', 'na', 'n/a'].includes((row?.days?.[k] ?? '').toString().trim().toLowerCase()))
            );
            const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
            valor = hasAnswers || hasDatos;
            break;
          }

          case 'checkListConformidadSegregacionDmh':
          case 'checklistConformidadSegregacionDmh':
          case 'FOR-SGI-CDMH-01-SST-020 CHECK LIST DE CONFORMIDAD DE LA SEGREGACION':
          case 'FOR-SGI-CDMH-01-SST-020 CHECK LIST DE CONFORMIDAD DE LA SEGREGACIÓN': {
            valor = hasConformidadSegregacionDmhData(attr);
            break;
          }

          case 'checkListInspeccionEprDmh':
          case 'checklistInspeccionEprDmh':
          case 'FOR-SGI-CDMH-01-SST-021 INSPECCION EPR':
          case 'FOR-SGI-CDMH-01-SST-021 INSPECCIÓN EPR': {
            valor = hasInspeccionEprDmhData(attr);
            break;
          }

          case 'checkListEstabilidadSueloDmh':
          case 'checklistEstabilidadSueloDmh':
          case 'FOR-SGI-CDMH-01-SST-022 FORMATO VERIFICACION DE ESTABILIDAD DEL SUELO':
          case 'FOR-SGI-CDMH-01-SST-022 FORMATO VERIFICACIÓN DE ESTABILIDAD DEL SUELO': {
            valor = hasEstabilidadSueloDmhData(attr);
            break;
          }

          case 'checkListAseoDesinfeccionDmh':
          case 'checklistAseoDesinfeccionDmh':
          case 'FOR-SGI-CDMH-01-SST-023 PLANILLA DE CONTROL DE ASEO Y DESINFECCION':
          case 'FOR-SGI-CDMH-01-SST-023 PLANILLA DE CONTROL DE ASEO Y DESINFECCIÓN': {
            valor = hasAseoDesinfeccionDmhData(attr);
            break;
          }

          case 'checkListControlNeumaticosDmh':
          case 'checklistControlNeumaticosDmh':
          case 'FOR-SGI-CDMH-01-SST-025 CONTROL E INSPECCION DE NEUMATICOS':
          case 'FOR-SGI-CDMH-01-SST-025 CONTROL E INSPECCIÓN DE NEUMÁTICOS': {
            valor = hasControlNeumaticosDmhData(attr);
            break;
          }

          case 'checkListElementosVisibilidadDmh':
          case 'checklistElementosVisibilidadDmh':
          case 'FOR-SGI-CDMH-01-SST-026 CHECKLIST DEL ESTADO OPERATIVO DE ELEMENTOS DE VISIBILIDAD': {
            valor = hasElementosVisibilidadDmhData(attr);
            break;
          }

          case 'checkListCamionPlumaAmsa':
          case 'checklistCamionPlumaAmsa':
          case 'CL-SGI-MLP-02-002 Camion Pluma Rev0':
          case 'CL-SGI-MLP-02-002 Camión Pluma Rev0': {
            valor = hasCamionPlumaAmsaData(attr);
            break;
          }

          case 'checkListCamionetaAmsa':
          case 'checklistCamionetaAmsa':
          case 'CL-SGI-MLP-02-003 Camioneta': {
            valor = hasCamionetaAmsaData(attr);
            break;
          }

          case 'checkListGruaHorquillaPostUsoAmsa':
          case 'checkListGruaHorquillaAmsa':
          case 'checkListGruaMovilAmsa':
          case 'checkListCancamosAmsa':
          case 'checkListEslingaCadenasAmsa':
          case 'checkListEslingasPoliesterAmsa':
          case 'checkListEslingasTubularesAmsa':
          case 'checkListEstrobosAceroAmsa':
          case 'checkListFajasAmarreAmsa':
          case 'checkListGrilletesAmsa':
          case 'checkListArnesSeguridadAmsa':
          case 'checkListCajaInviernoAmsa':
          case 'checkListEscalasPortatilesAmsa':
          case 'checkListInspeccionEppAmsa':
          case 'checkListExtintoresAmsa':
          case 'checkListControlLicenciasAmsa':
          case 'checkListCancamosPdfAmsa':
          case 'checkListEscalaTipoAvionAmsa': {
            valor = hasAmsaChecklistData(attr);
            break;
          }

          case 'checkListTransmacExtintoresCalama':
          case 'checkListTransmacExtintoresLosAndes':
          case 'checkListTransmacFatigaSomnolencia':
          case 'checkListTransmacFatigaSomnolenciaSpa':
          case 'checkListTransmacHerramientasNeumaticas':
          case 'checkListTransmacMiniCargador':
          case 'checkListTransmacCamionAljibe':
          case 'checkListTransmacCamionPluma':
          case 'checkListTransmacCargadorFrontal':
          case 'checkListTransmacCamionTolva':
          case 'checkListTransmacBulldozer':
          case 'checkListTransmacExcavadora':
          case 'checkListTransmacLlaveImpactoNeumatica':
          case 'checkListTransmacSoldadora':
          case 'checkListTransmacEsmerilAngular':
          case 'checkListTransmacElevadorPlataforma':
          case 'checkListTransmacGanchosGrilletes':
          case 'checkListTransmacCadenasAmarre':
          case 'checkListTransmacEslingasAmarre':
          case 'checkListTransmacSpaCadenasAmarre':
          case 'checkListTransmacSpaEslingasAmarre':
          case 'checkListTransmacElementosIzaje':
          case 'checkListTransmacEvaluacionTerrenoIzaje':
          case 'checkListTransmacEquiposTransporteSpa':
          case 'checkListTransmacSpaEquiposTransporte': {
            valor = hasAmsaChecklistData(attr);
            break;
          }

          case 'checkListGruaCdch': {
            valor = hasAmsaChecklistData(attr);
            break;
          }

          case 'checkListSpotEslingaCadenasCodelco':
          case 'checkListSpotEslingasPoliesterCodelco':
          case 'checkListSpotEslingasTubularesCodelco':
          case 'checkListSpotEstrobosAceroCodelco':
          case 'checkListSpotGrilletesCodelco':
          case 'checkListSpotFajasAmarreCodelco':
          case 'checkListSpotArnesSeguridadCodelco':
          case 'checkListSpotEscalasPortatilesCodelco':
          case 'checkListSpotCancamosCodelco':
          case 'checkListSpotGruaCodelco':
          case 'checkListSpotAccesoriosAmarreCodelco':
          case 'checkListSpotAlzaHombreCodelco':
          case 'checkListSpotComunicacionRadialCodelco': {
            valor = hasAmsaChecklistData(attr);
            break;
          }

          case 'checkListArnesRespirador':
          case 'checklistArnesRespirador':
          case 'CHECK LIST ARNES RESPIRADOR':
          case 'CHECK LIST ARNÉS RESPIRADOR': {
            const groups = Array.isArray(attr?.arnes?.groups) ? attr.arnes.groups : [];
            const respiradorItems = Array.isArray(attr?.respirador?.items) ? attr.respirador.items : [];
            const dayKeys = ['m1', 'm2', 'j', 'v', 's', 'd', 'l'];
            const hasArnesData = groups.some((group) =>
              (group?.items || []).some((item) =>
                dayKeys.some((k) => (item?.days?.[k] ?? '').toString().trim().toLowerCase() === 'si') ||
                (item?.observacion ?? '').toString().trim() !== ''
              )
            );
            const hasRespiradorData = respiradorItems.some((item) =>
              dayKeys.some((k) => (item?.days?.[k] ?? '').toString().trim().toLowerCase() === 'si') ||
              (item?.observacion ?? '').toString().trim() !== ''
            );
            const hasEquipoData = Object.values(attr?.equipo || {}).some((value) => String(value ?? '').trim() !== '');
            valor = hasArnesData || hasRespiradorData || hasEquipoData;
            break;
          }

          case 'checkListArnesSeguridadDmh':
          case 'checklistArnesSeguridadDmh':
          case 'FOR-SGI-CDMH-01-SST-010 CHECK LIST ARNÉS DE SEGURIDAD':
          case 'FOR-SGI-CDMH-01-SST-010 CHECK LIST ARNES DE SEGURIDAD': {
            valor = hasArnesSeguridadDmhData(attr);
            break;
          }

          case 'checkListElementosIzajeDmh':
          case 'checklistElementosIzajeDmh':
          case 'FOR-SGI-CDMH-01-SST-011 CHECK LIST ELEMENTOS DE IZAJE': {
            valor = hasElementosIzajeDmhData(attr);
            break;
          }

          case 'atsToggles':
          case 'atsBloquesToggle':
          case 'ATS BLOQUES TOGGLE': {
            const blocks = Array.isArray(attr.blocks) ? attr.blocks : [];
            valor = blocks.length > 0 && blocks.every((block) => {
              const items = Array.isArray(block?.items) ? block.items : [];
              return items.some((item) => Boolean(item?.tick));
            });
            break;
          }

          case 'tarea':
          case 'tareaAts':
          case 'TAREA ATS': {
            const rows = Array.isArray(attr.body) ? attr.body : [];
            valor = rows.length > 0 && rows.every((row) => {
              const tarea = (row?.tareaEtapa ?? '').toString().trim();
              const peligros = Array.isArray(row?.peligros) ? row.peligros : [];
              const hasPairInNested = peligros.some((p) => {
                const peligroTxt = (p?.peligro ?? '').toString().trim();
                const riesgos = Array.isArray(p?.riesgos) ? p.riesgos : [];
                const hasRiesgo = riesgos.some((r) => (r?.riesgo ?? '').toString().trim() !== '');
                return peligroTxt !== '' && hasRiesgo;
              });
              const peligro = (row?.peligro ?? '').toString().trim();
              const riesgo = (row?.riesgo ?? '').toString().trim();
              const hasLegacyPair = peligro !== '' && riesgo !== '';
              return tarea !== '' && (hasPairInNested || hasLegacyPair);
            });
            break;
          }

          case 'listaInspeccionCamion':
          case 'LISTA INSPECCION CAMION': {
            const rows = (Array.isArray(attr.body) ? attr.body : [])
              .filter((row) => row?.kind === 'item');
            const weekKeys = ['s1', 's2', 's3', 's4'];
            const hasChecks = rows.length > 0 && rows.some((row) =>
              weekKeys.some((k) => ['si', 'no', 'na'].includes((row?.weeks?.[k] ?? '').toString().trim().toLowerCase()))
            );

            const resumen = Array.isArray(attr.resumenSemanal) ? attr.resumenSemanal : [];
            const hasResumen = resumen.some((r) => {
              const hasObs = (r?.observacion ?? '').toString().trim() !== '';
              const hasAccion = (r?.accionResponsable ?? '').toString().trim() !== '';
              const hasFecha = (r?.fecha ?? '').toString().trim() !== '';
              return hasObs || hasAccion || hasFecha;
            });

            valor = hasChecks || hasResumen;
            break;
          }

          case 'checkListTecles':
          case 'checkListTecle':
          case 'CHECK LIST TECLES': {
            const items = Array.isArray(attr.checkBoby) ? attr.checkBoby : [];
            valor = items.every((item) => {
              if (item?.nullable === true) return true;
              const summary = (item?.default ?? '').toString().trim().toLowerCase();
              if (!summary) return false;

              const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
              const days = item?.days || {};
              const checkedDays = dayKeys.filter((key) => Boolean(days?.[key])).length;

              // Si no aplica, no debe tener dias marcados
              if (summary === 'n/a' || summary === 'na') {
                if (checkedDays > 0) return false;
                return (item?.obs ?? '').toString().trim() !== '';
              }

              // Para SI/NO exigimos al menos un dia marcado
              if ((summary === 'si' || summary === 'no') && checkedDays === 0) return false;

              if (summary === 'no') return (item?.obs ?? '').toString().trim() !== '';

              return true;
            });
            break;
          }

          case 'matrizCheck': {
            valor = isMatrizCheckComplete(attr);
            break;
          }

          case 'checkExtintores': {
            valor = isCheckExtintoresComplete(attr);
            break;
          }

          case 'checkListExtintorCdch':
          case 'checklistExtintorCdch':
          case 'CHECK LIST EXTINTOR CDCH':
          case 'CHECK LIST EXTINTOR':
          case 'checkListGrilleteCdch':
          case 'checklistGrilleteCdch':
          case 'CHECK LIST GRILLETE CDCH':
          case 'CHECK LIST GRILLETE':
          case 'checkListRetractilCdch':
          case 'checklistRetractilCdch':
          case 'CHECK LIST RETRACTIL CDCH':
          case 'CHECK LIST RETRACTIL': {
            const componentes = Array.isArray(attr?.componentes) ? attr.componentes : [];
            const dayKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
            const hasComponentData = componentes.some((item) =>
              dayKeys.some((k) => ['si', 'no', 'na', 'n/a'].includes((item?.days?.[k] ?? '').toString().trim().toLowerCase())) ||
              (item?.medidaCorrectiva ?? '').toString().trim() !== ''
            );
            const hasIdentificacion = Object.values(attr?.identificacion || {}).some((value) => String(value ?? '').trim() !== '');
            const hasDescripcion = Object.values(attr?.descripcionEquipo || {}).some((value) => String(value ?? '').trim() !== '');
            const hasObs = String(attr?.observaciones ?? '').trim() !== '';
            valor = hasComponentData || hasIdentificacion || hasDescripcion || hasObs;
            break;
          }

          case 'checkListEslingasTubularesCdch':
          case 'checklistEslingasTubularesCdch':
          case 'CHECK LIST ESLINGAS TUBULARES CDCH':
          case 'CHECK LIST ESLINGAS TUBULARES': {
            const hasDescripcion = Object.values(attr?.descripcion || {}).some((value) => String(value ?? '').trim() !== '');
            const hasCondiciones = (Array.isArray(attr?.condiciones) ? attr.condiciones : []).some((item) =>
              ['si', 'no'].includes(String(item?.estado ?? '').trim().toLowerCase()) ||
              String(item?.comentarios ?? '').trim() !== ''
            );
            const hasDesviaciones = (Array.isArray(attr?.desviaciones) ? attr.desviaciones : []).some((row) =>
              ['desviacion', 'accionCorrectiva', 'responsable', 'fechaEjecucion'].some((key) => String(row?.[key] ?? '').trim() !== '')
            );
            valor = hasDescripcion || hasCondiciones || hasDesviaciones;
            break;
          }

          case 'checkListControlVientoCdch':
          case 'checklistControlVientoCdch':
          case 'CHECK LIST CONTROL DE VIENTO CDCH':
          case 'CHECK LIST CONTROL DE VIENTO': {
            const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
            const hasLecturas = (Array.isArray(attr?.lecturas) ? attr.lecturas : []).some((row) =>
              ['lecturas', 'hora', 'constante', 'rafaga', 'horaSuspension', 'horaReanudacion', 'observaciones'].some((key) => String(row?.[key] ?? '').trim() !== '')
            );
            valor = hasDatos || hasLecturas;
            break;
          }

          case 'checkListVerificacionSueloCdch':
          case 'checklistVerificacionSueloCdch':
          case 'CHECK LIST VERIFICACION DEL SUELO CDCH':
          case 'CHECK LIST VERIFICACION DEL SUELO': {
            const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
            const hasItems = (Array.isArray(attr?.items) ? attr.items : []).some((item) =>
              ['si', 'no', 'na', 'n/a'].includes(String(item?.estado ?? '').trim().toLowerCase()) ||
              String(item?.observaciones ?? '').trim() !== ''
            );
            const hasResultado = Object.values(attr?.resultadoFinal || {}).some((value) => String(value ?? '').trim() !== '');
            valor = hasDatos || hasItems || hasResultado;
            break;
          }

          case 'checkListAccesoriosAmarreCdch':
          case 'checklistAccesoriosAmarreCdch':
          case 'CHECK LIST ACCESORIOS DE AMARRE CDCH':
          case 'CHECK LIST ACCESORIOS DE AMARRE': {
            const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
            const grupos = attr?.grupos && typeof attr.grupos === 'object' ? Object.values(attr.grupos) : [];
            const hasItems = grupos.some((items) => (Array.isArray(items) ? items : []).some((item) => {
              const hasFoto = Array.isArray(item?.galeria) && item.galeria.length > 0;
              const hasRespuestas = Object.values(item?.respuestas || {}).some((value) => ['si', 'no'].includes(String(value ?? '').trim().toLowerCase()));
              return hasFoto || hasRespuestas;
            }));
            const hasObs = String(attr?.observaciones ?? '').trim() !== '';
            valor = hasDatos || hasItems || hasObs;
            break;
          }

          case 'checkListCamaBajaCdch':
          case 'checklistCamaBajaCdch':
          case 'CHECK LIST DIARIO CAMA BAJA':
          case 'CL-SGI-CDCH-02-SST-003': {
            valor = hasCamaBajaCdchData(attr);
            break;
          }

          case 'checkListCamionetaCdch':
          case 'checklistCamionetaCdch':
          case 'CHECK LIST CAMIONETA':
          case 'CL-SGI-CDCH-02-SST-012': {
            valor = hasCamionetaCdchData(attr);
            break;
          }

          case 'checkListCamionetaDmh':
          case 'checklistCamionetaDmh':
          case 'FOR-SGI-CDMH-01-SST-015 INSPECCION CAMIONETA': {
            valor = hasCamionetaDmhData(attr);
            break;
          }

          case 'checkListCamionRamplaDmh':
          case 'checklistCamionRamplaDmh':
          case 'FOR-SGI-CDMH-01-SST-016 CHECK LIST CAMION RAMPLA': {
            valor = hasCamionRamplaDmhData(attr);
            break;
          }

          case 'checkListGruaHorquillaDmh':
          case 'checklistGruaHorquillaDmh':
          case 'FOR-SGI-CDMH-01-SST-017 CHECK LIST GRUA HORQUILLA':
          case 'FOR-SGI-CDMH-01-SST-017 CHECK LIST GRÚA HORQUILLA': {
            valor = hasGruaHorquillaDmhData(attr);
            break;
          }

          case 'checkListCamionGruaDmh':
          case 'checklistCamionGruaDmh':
          case 'FOR-SGI-CDMH-01-SST-018 CHECK LIST CAMION GRUA':
          case 'FOR-SGI-CDMH-01-SST-018 CHECK LIST CAMION GRÚA': {
            valor = hasCamionGruaDmhData(attr);
            break;
          }

          case 'checkListCamionPlumaDmh':
          case 'checklistCamionPlumaDmh':
          case 'FOR-SGI-CDMH-01-SST-019 CHECK LIST CAMION PLUMA': {
            valor = hasCamionPlumaDmhData(attr);
            break;
          }

          case 'checkListAlzaHombreDmh':
          case 'checklistAlzaHombreDmh':
          case 'FOR-SGI-CDMH-01-SST-020 CHECK LIST ALZA HOMBRE': {
            valor = hasAlzaHombreDmhData(attr);
            break;
          }

          case 'checkEpp':
          case 'checkEPP':
          case 'inspeccionEpp':
          case 'inspeccionEPP': {
            valor = isCheckEppComplete(attr);
            break;
          }

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
      const attrs = Array.isArray(segmento.attributes) ? segmento.attributes : [];
      const checkListObservacionConductualAttrs = attrs.filter((a) => a?.type === 'checkListObservacionConductual');
      if (checkListObservacionConductualAttrs.length > 0) {
        segmento.touch = checkListObservacionConductualAttrs.every((a) => isObservacionConductualComplete(a));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkEppAttrs = attrs.filter((a) => ['checkEpp', 'checkEPP', 'inspeccionEpp', 'inspeccionEPP'].includes(a?.type));
      if (checkEppAttrs.length > 0) {
        segmento.touch = checkEppAttrs.every((a) => isCheckEppComplete(a));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkExtintoresAttrs = attrs.filter((a) => a?.type === 'checkExtintores');
      if (checkExtintoresAttrs.length > 0) {
        segmento.touch = checkExtintoresAttrs.every((a) => isCheckExtintoresComplete(a));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListExtintorCdchAttrs = attrs.filter((a) => ['checkListExtintorCdch', 'checklistExtintorCdch', 'CHECK LIST EXTINTOR CDCH', 'CHECK LIST EXTINTOR', 'checkListGrilleteCdch', 'checklistGrilleteCdch', 'CHECK LIST GRILLETE CDCH', 'CHECK LIST GRILLETE', 'checkListRetractilCdch', 'checklistRetractilCdch', 'CHECK LIST RETRACTIL CDCH', 'CHECK LIST RETRACTIL'].includes(a?.type));
      if (checkListExtintorCdchAttrs.length > 0) {
        segmento.touch = checkListExtintorCdchAttrs.some((attr) => {
          const componentes = Array.isArray(attr?.componentes) ? attr.componentes : [];
          const dayKeys = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
          const hasComponentData = componentes.some((item) =>
            dayKeys.some((k) => ['si', 'no', 'na', 'n/a'].includes((item?.days?.[k] ?? '').toString().trim().toLowerCase())) ||
            (item?.medidaCorrectiva ?? '').toString().trim() !== ''
          );
          const hasIdentificacion = Object.values(attr?.identificacion || {}).some((value) => String(value ?? '').trim() !== '');
          const hasDescripcion = Object.values(attr?.descripcionEquipo || {}).some((value) => String(value ?? '').trim() !== '');
          const hasObs = String(attr?.observaciones ?? '').trim() !== '';
          return hasComponentData || hasIdentificacion || hasDescripcion || hasObs;
        });
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListEslingasTubularesAttrs = attrs.filter((a) => ['checkListEslingasTubularesCdch', 'checklistEslingasTubularesCdch', 'CHECK LIST ESLINGAS TUBULARES CDCH', 'CHECK LIST ESLINGAS TUBULARES'].includes(a?.type));
      if (checkListEslingasTubularesAttrs.length > 0) {
        segmento.touch = checkListEslingasTubularesAttrs.some((attr) => {
          const hasDescripcion = Object.values(attr?.descripcion || {}).some((value) => String(value ?? '').trim() !== '');
          const hasCondiciones = (Array.isArray(attr?.condiciones) ? attr.condiciones : []).some((item) =>
            ['si', 'no'].includes(String(item?.estado ?? '').trim().toLowerCase()) ||
            String(item?.comentarios ?? '').trim() !== ''
          );
          const hasDesviaciones = (Array.isArray(attr?.desviaciones) ? attr.desviaciones : []).some((row) =>
            ['desviacion', 'accionCorrectiva', 'responsable', 'fechaEjecucion'].some((key) => String(row?.[key] ?? '').trim() !== '')
          );
          return hasDescripcion || hasCondiciones || hasDesviaciones;
        });
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListControlVientoAttrs = attrs.filter((a) => ['checkListControlVientoCdch', 'checklistControlVientoCdch', 'CHECK LIST CONTROL DE VIENTO CDCH', 'CHECK LIST CONTROL DE VIENTO'].includes(a?.type));
      if (checkListControlVientoAttrs.length > 0) {
        segmento.touch = checkListControlVientoAttrs.some((attr) => {
          const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
          const hasLecturas = (Array.isArray(attr?.lecturas) ? attr.lecturas : []).some((row) =>
            ['lecturas', 'hora', 'constante', 'rafaga', 'horaSuspension', 'horaReanudacion', 'observaciones'].some((key) => String(row?.[key] ?? '').trim() !== '')
          );
          return hasDatos || hasLecturas;
        });
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListVerificacionSueloAttrs = attrs.filter((a) => ['checkListVerificacionSueloCdch', 'checklistVerificacionSueloCdch', 'CHECK LIST VERIFICACION DEL SUELO CDCH', 'CHECK LIST VERIFICACION DEL SUELO'].includes(a?.type));
      if (checkListVerificacionSueloAttrs.length > 0) {
        segmento.touch = checkListVerificacionSueloAttrs.some((attr) => {
          const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
          const hasItems = (Array.isArray(attr?.items) ? attr.items : []).some((item) =>
            ['si', 'no', 'na', 'n/a'].includes(String(item?.estado ?? '').trim().toLowerCase()) ||
            String(item?.observaciones ?? '').trim() !== ''
          );
          const hasResultado = Object.values(attr?.resultadoFinal || {}).some((value) => String(value ?? '').trim() !== '');
          return hasDatos || hasItems || hasResultado;
        });
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListAccesoriosAmarreAttrs = attrs.filter((a) => ['checkListAccesoriosAmarreCdch', 'checklistAccesoriosAmarreCdch', 'CHECK LIST ACCESORIOS DE AMARRE CDCH', 'CHECK LIST ACCESORIOS DE AMARRE'].includes(a?.type));
      if (checkListAccesoriosAmarreAttrs.length > 0) {
        segmento.touch = checkListAccesoriosAmarreAttrs.some((attr) => {
          const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
          const grupos = attr?.grupos && typeof attr.grupos === 'object' ? Object.values(attr.grupos) : [];
          const hasItems = grupos.some((items) => (Array.isArray(items) ? items : []).some((item) => {
            const hasFoto = Array.isArray(item?.galeria) && item.galeria.length > 0;
            const hasRespuestas = Object.values(item?.respuestas || {}).some((value) => ['si', 'no'].includes(String(value ?? '').trim().toLowerCase()));
            return hasFoto || hasRespuestas;
          }));
          const hasObs = String(attr?.observaciones ?? '').trim() !== '';
          return hasDatos || hasItems || hasObs;
        });
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListCamaBajaAttrs = attrs.filter((a) => isCamaBajaCdchType(a?.type));
      if (checkListCamaBajaAttrs.length > 0) {
        segmento.touch = checkListCamaBajaAttrs.some((attr) => hasCamaBajaCdchData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListCamionetaAttrs = attrs.filter((a) => isCamionetaCdchType(a?.type));
      if (checkListCamionetaAttrs.length > 0) {
        segmento.touch = checkListCamionetaAttrs.some((attr) => hasCamionetaCdchData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListArnesSeguridadDmhAttrs = attrs.filter((a) => isArnesSeguridadDmhType(a?.type));
      if (checkListArnesSeguridadDmhAttrs.length > 0) {
        segmento.touch = checkListArnesSeguridadDmhAttrs.some((attr) => hasArnesSeguridadDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListElementosIzajeDmhAttrs = attrs.filter((a) => isElementosIzajeDmhType(a?.type));
      if (checkListElementosIzajeDmhAttrs.length > 0) {
        segmento.touch = checkListElementosIzajeDmhAttrs.some((attr) => hasElementosIzajeDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListCamionetaDmhAttrs = attrs.filter((a) => isCamionetaDmhType(a?.type));
      if (checkListCamionetaDmhAttrs.length > 0) {
        segmento.touch = checkListCamionetaDmhAttrs.some((attr) => hasCamionetaDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListCamionRamplaDmhAttrs = attrs.filter((a) => isCamionRamplaDmhType(a?.type));
      if (checkListCamionRamplaDmhAttrs.length > 0) {
        segmento.touch = checkListCamionRamplaDmhAttrs.some((attr) => hasCamionRamplaDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListGruaHorquillaDmhAttrs = attrs.filter((a) => isGruaHorquillaDmhType(a?.type));
      if (checkListGruaHorquillaDmhAttrs.length > 0) {
        segmento.touch = checkListGruaHorquillaDmhAttrs.some((attr) => hasGruaHorquillaDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListCamionGruaDmhAttrs = attrs.filter((a) => isCamionGruaDmhType(a?.type));
      if (checkListCamionGruaDmhAttrs.length > 0) {
        segmento.touch = checkListCamionGruaDmhAttrs.some((attr) => hasCamionGruaDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListCamionPlumaDmhAttrs = attrs.filter((a) => isCamionPlumaDmhType(a?.type));
      if (checkListCamionPlumaDmhAttrs.length > 0) {
        segmento.touch = checkListCamionPlumaDmhAttrs.some((attr) => hasCamionPlumaDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const checkListAlzaHombreDmhAttrs = attrs.filter((a) => isAlzaHombreDmhType(a?.type));
      if (checkListAlzaHombreDmhAttrs.length > 0) {
        segmento.touch = checkListAlzaHombreDmhAttrs.some((attr) => hasAlzaHombreDmhData(attr));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      const matrizCheckAttrs = attrs.filter((a) => a?.type === 'matrizCheck');
      if (matrizCheckAttrs.length > 0) {
        segmento.touch = matrizCheckAttrs.every((a) => isMatrizCheckComplete(a));
        console.log("segmento.touch", segmento.touch)
        return;
      }

      segmento.attributes?.forEach((attr, idxAttr) => {
        if (attr.nullable == true && attr.type !== 'matrizCheck') return;
        console.log("segmento.type", attr.type);
        if (['textField', 'datePicker', 'dateHourPicker', 'textArea'].includes(attr.type)) {
          if (attr.default != '') {
            segmento.touch = true;
            console.log("segmento.touch", segmento.touch)
          }
          else {
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
            else {
              segmento.touch = false;
              console.log("segmento.touch", segmento.touch)
            }
          })
        }

        if (['checkListTecles', 'checkListTecle', 'CHECK LIST TECLES'].includes(attr.type)) {
          const items = Array.isArray(attr.checkBoby) ? attr.checkBoby : [];
          const completo = items.every((check) => {
            if (check?.nullable === true) return true;
            const summary = (check?.default ?? '').toString().trim().toLowerCase();
            if (!summary) return false;

            const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
            const days = check?.days || {};
            const checkedDays = dayKeys.filter((key) => Boolean(days?.[key])).length;

            if (summary === 'n/a' || summary === 'na') {
              if (checkedDays > 0) return false;
              return (check?.obs ?? '').toString().trim() !== '';
            }

            if ((summary === 'si' || summary === 'no') && checkedDays === 0) return false;

            if (summary === 'no') return (check?.obs ?? '').toString().trim() !== '';

            return true;
          });

          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['comboBox'].includes(attr.type)) {
          console.log("segmento.type", attr.type);
          if (attr.values.selected != '') {
            segmento.touch = true;
            console.log("segmento.touch", segmento.touch)
          }
          else {
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
          else {
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
          else {
            segmento.touch = false;
            console.log("segmento.touch", segmento.touch)
          }
        }

        if (['ingresoZanja'].includes(attr.type)) {
          const total = Array.isArray(attr.body) ? attr.body.length : 0;
          segmento.touch = total > 0;
          console.log("segmento.touch", segmento.touch)
        }

        if (['chequeoExtensionElectrica'].includes(attr.type)) {
          const blocks = Array.isArray(attr.body) ? attr.body : [];
          const completo = blocks.length > 0 && blocks.every((b) => {
            if (!b?.numero) return false;
            const estado = (b?.estado ?? '').toString().trim().toLowerCase();
            return estado === 'aprobado' || estado === 'rechazado';
          });
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['checkMonofasicoTrifasico'].includes(attr.type)) {
          const rows = Array.isArray(attr.body) ? attr.body : [];
          const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
          const completo = rows.length > 0 && rows.some((row) => {
            const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
            const hasObs = (row?.observaciones ?? '').toString().trim() !== '';
            return hasDay || hasObs;
          });
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['vibropison'].includes(attr.type)) {
          const rows = Array.isArray(attr.body) ? attr.body : [];
          const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
          const hasData = rows.length > 0 && rows.some((row) => {
            const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
            const hasObs = (row?.observacion ?? '').toString().trim() !== '';
            return hasDay || hasObs;
          });
          const estado = (attr?.estado ?? '').toString().trim().toLowerCase();
          const completo = hasData && (estado === 'aprobada' || estado === 'reprobada');
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['chequeoSeguridadBetonera'].includes(attr.type)) {
          const rows = Array.isArray(attr.body) ? attr.body : [];
          const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
          const hasData = rows.length > 0 && rows.some((row) => {
            const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
            const hasObs = (row?.observacion ?? '').toString().trim() !== '';
            return hasDay || hasObs;
          });
          const estado = (attr?.estado ?? '').toString().trim().toLowerCase();
          const completo = hasData && (estado === 'aprobada' || estado === 'reprobada');
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['checkeoMartilloDemoledor'].includes(attr.type)) {
          const rows = Array.isArray(attr.body) ? attr.body : [];
          const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
          const hasData = rows.length > 0 && rows.some((row) => {
            const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
            const hasObs = (row?.observacion ?? '').toString().trim() !== '';
            return hasDay || hasObs;
          });
          const estado = (attr?.estado ?? '').toString().trim().toLowerCase();
          const completo = hasData && (estado === 'aprobada' || estado === 'reprobada');
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['checkEquiposIluminacion'].includes(attr.type)) {
          const rows = (Array.isArray(attr.body) ? attr.body : [])
            .filter((row) => row?.kind !== 'group');
          const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
          const completo = rows.length > 0 && rows.some((row) => {
            const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
            const hasObs = dayKeys.some((k) => ((row?.obsByDay?.[k] ?? row?.obs ?? '').toString().trim() !== ''));
            return hasDay || hasObs;
          });
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['checkDispensadorAguaPotable'].includes(attr.type)) {
          const rows = Array.isArray(attr.body) ? attr.body : [];
          const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
          const activeRows = rows.filter((row) => dayKeys.some((k) => Boolean(row?.days?.[k])));
          const hasData = activeRows.length > 0;
          const perRowComplete = activeRows.every((row) => {
            const hasResponsable = (row?.responsable ?? '').toString().trim() !== '' || !!row?.responsableId;
            const hasFecha = (row?.fecha ?? '').toString().trim() !== '';
            return hasResponsable && hasFecha;
          });
          const completo = hasData && perRowComplete;
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['checkListHerramientasManuales', 'checklistHerramientasManuales', 'CHECK LIST HERRAMIENTAS MANUALES'].includes(attr.type)) {
          const rows = (Array.isArray(attr.body) ? attr.body : [])
            .filter((row) => row?.kind === 'item');
          const dayKeys = ['l', 'ma', 'mi', 'j', 'v'];
          const completo = rows.length > 0 && rows.some((row) => {
            const hasDay = dayKeys.some((k) => Boolean(row?.days?.[k]));
            const hasObs = (row?.observacion ?? '').toString().trim() !== '';
            return hasDay || hasObs;
          });
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (isComunicacionRadialType(attr.type) || isComunicacionRadialDmhType(attr.type) || isSpotComunicacionRadialCodelcoType(attr.type)) {
          const rows = (Array.isArray(attr.body) ? attr.body : [])
            .filter((row) => row?.kind !== 'group');
          const dayKeys = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7'];
          const hasAnswers = rows.length > 0 && rows.some((row) =>
            dayKeys.some((k) => ['si', 'no', 'na', 'n/a'].includes((row?.days?.[k] ?? '').toString().trim().toLowerCase()))
          );
          const hasDatos = Object.values(attr?.datos || {}).some((value) => String(value ?? '').trim() !== '');
          const completo = hasAnswers || hasDatos;
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (isConformidadSegregacionDmhType(attr.type)) {
          segmento.touch = hasConformidadSegregacionDmhData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isInspeccionEprDmhType(attr.type)) {
          segmento.touch = hasInspeccionEprDmhData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isEstabilidadSueloDmhType(attr.type)) {
          segmento.touch = hasEstabilidadSueloDmhData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isAseoDesinfeccionDmhType(attr.type)) {
          segmento.touch = hasAseoDesinfeccionDmhData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isControlNeumaticosDmhType(attr.type)) {
          segmento.touch = hasControlNeumaticosDmhData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isElementosVisibilidadDmhType(attr.type)) {
          segmento.touch = hasElementosVisibilidadDmhData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isCamionPlumaAmsaType(attr.type)) {
          segmento.touch = hasCamionPlumaAmsaData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isCamionetaAmsaType(attr.type)) {
          segmento.touch = hasCamionetaAmsaData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isAmsaGeneratedType(attr.type)) {
          segmento.touch = hasAmsaChecklistData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isTransmacGeneratedType(attr.type)) {
          segmento.touch = hasAmsaChecklistData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isCdchGeneratedType(attr.type)) {
          segmento.touch = hasAmsaChecklistData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (isSpotCodelcoType(attr.type) && !isSpotComunicacionRadialCodelcoType(attr.type)) {
          segmento.touch = hasAmsaChecklistData(attr);
          console.log("segmento.touch", segmento.touch)
        }

        if (['checkListArnesRespirador', 'checklistArnesRespirador', 'CHECK LIST ARNES RESPIRADOR', 'CHECK LIST ARNÉS RESPIRADOR'].includes(attr.type)) {
          const groups = Array.isArray(attr?.arnes?.groups) ? attr.arnes.groups : [];
          const respiradorItems = Array.isArray(attr?.respirador?.items) ? attr.respirador.items : [];
          const dayKeys = ['m1', 'm2', 'j', 'v', 's', 'd', 'l'];
          const hasArnesData = groups.some((group) =>
            (group?.items || []).some((item) =>
              dayKeys.some((k) => (item?.days?.[k] ?? '').toString().trim().toLowerCase() === 'si') ||
              (item?.observacion ?? '').toString().trim() !== ''
            )
          );
          const hasRespiradorData = respiradorItems.some((item) =>
            dayKeys.some((k) => (item?.days?.[k] ?? '').toString().trim().toLowerCase() === 'si') ||
            (item?.observacion ?? '').toString().trim() !== ''
          );
          const hasEquipoData = Object.values(attr?.equipo || {}).some((value) => String(value ?? '').trim() !== '');
          const completo = hasArnesData || hasRespiradorData || hasEquipoData;
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['atsToggles', 'atsBloquesToggle', 'ATS BLOQUES TOGGLE'].includes(attr.type)) {
          const blocks = Array.isArray(attr.blocks) ? attr.blocks : [];
          const completo = blocks.length > 0 && blocks.every((block) => {
            const items = Array.isArray(block?.items) ? block.items : [];
            return items.some((item) => Boolean(item?.tick));
          });
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (['tarea', 'tareaAts', 'TAREA ATS'].includes(attr.type)) {
          const rows = Array.isArray(attr.body) ? attr.body : [];
          const completo = rows.length > 0 && rows.some((row) => {
            const tarea = (row?.tareaEtapa ?? '').toString().trim();
            const peligros = Array.isArray(row?.peligros) ? row.peligros : [];
            const hasAnyNestedData = peligros.some((p) => {
              const peligroTxt = (p?.peligro ?? '').toString().trim();
              const riesgos = Array.isArray(p?.riesgos) ? p.riesgos : [];
              const hasRiesgo = riesgos.some((r) => (r?.riesgo ?? '').toString().trim() !== '');
              return peligroTxt !== '' || hasRiesgo;
            });
            const peligro = (row?.peligro ?? '').toString().trim();
            const riesgo = (row?.riesgo ?? '').toString().trim();
            const medidas = (row?.medidasControl ?? '').toString().trim();
            return tarea !== '' || peligro !== '' || riesgo !== '' || medidas !== '' || hasAnyNestedData;
          });
          segmento.touch = completo;
          console.log("segmento.touch", segmento.touch)
        }

        if (isCondicionesSeguridadType(attr.type)) {
          const blocks = Array.isArray(attr.blocks) ? attr.blocks : []
          const hasData = blocks.some((block) => {
            const hasApply = ['aplica', 'no_aplica'].includes(String(block?.aplica ?? '').toLowerCase())
            const items = Array.isArray(block?.items) ? block.items : []
            const hasItemData = items.some((item) => {
              const estado = String(item?.estado ?? '').trim().toUpperCase()
              const sev = String(item?.severidad ?? '').trim().toUpperCase()
              const obs = String(item?.observacion ?? '').trim()
              return ['NA', 'C', 'I', 'RI'].includes(estado) || ['L', 'G', 'MG'].includes(sev) || obs !== ''
            })
            return hasApply || hasItemData
          })
          segmento.touch = hasData
          console.log("segmento.touch", segmento.touch)
        }

        if (['checkBanosInstalaciones', 'checkBanos', 'CHECK BANOS INSTALACIONES'].includes(attr.type)) {
          const blocks = Array.isArray(attr.blocks) ? attr.blocks : [];
          const hasData = blocks.some((block) =>
            (Array.isArray(block?.items) ? block.items : []).some((item) => {
              const estado = (item?.estado ?? '').toString().trim().toUpperCase();
              const obs = (item?.observacion ?? '').toString().trim();
              const fecha = (item?.fechaCorreccion ?? '').toString().trim();
              return estado === 'SI' || estado === 'NO' || estado === 'NA' || obs !== '' || fecha !== '';
            })
          );
          segmento.touch = hasData;
          console.log("segmento.touch", segmento.touch)
        }

        if (['listaInspeccionCamion', 'LISTA INSPECCION CAMION'].includes(attr.type)) {
          const rows = (Array.isArray(attr.body) ? attr.body : [])
            .filter((row) => row?.kind === 'item');
          const weekKeys = ['s1', 's2', 's3', 's4'];
          const hasChecks = rows.length > 0 && rows.some((row) =>
            weekKeys.some((k) => ['si', 'no', 'na'].includes((row?.weeks?.[k] ?? '').toString().trim().toLowerCase()))
          );

          const resumen = Array.isArray(attr.resumenSemanal) ? attr.resumenSemanal : [];
          const hasResumen = resumen.some((r) => {
            const hasObs = (r?.observacion ?? '').toString().trim() !== '';
            const hasAccion = (r?.accionResponsable ?? '').toString().trim() !== '';
            const hasFecha = (r?.fecha ?? '').toString().trim() !== '';
            return hasObs || hasAccion || hasFecha;
          });

          segmento.touch = hasChecks || hasResumen;
          console.log("segmento.touch", segmento.touch)
        }

      })
    })
  });
}

// Opciones del combo
const isFalseyEditFlag = (v) => v === false || v === 'false' || v === 0 || v === '0';
const isEditable = (cell) => !isFalseyEditFlag(cell?.editable);
const canEdit = (cell) => cell?.editable !== false;
const checkItems = ['SI', 'NO', 'N/A'];

function onCheckChange(cell, val) {
  cell.value = (val ?? '').toString().trim().toUpperCase();
}
function onlyNumberKeypress(e) {
  const ch = e.key;
  const ok = /[0-9.,]/.test(ch) || ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(ch);
  if (!ok) e.preventDefault();
}
function sanitizeNumber(cell) {
  let s = String(cell?.value ?? '').trim();
  if (s === '') { cell.value = ''; return; }
  s = s.replace(/\s+/g, '').replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  cell.value = Number.isFinite(n) ? n : '';
}

// Devuelve un array de anchos por columna expandiendo los colspan del primer header row
function columnWidths(attr) {
  const firstRow = (attr?.headers?.[0] ?? []);
  const widths = [];
  for (const cell of firstRow) {
    const span = Number(cell.colspan || 1);
    const w = cell.width || '';
    for (let i = 0; i < span; i++) widths.push(w);
  }
  return widths;
}

// ==== Helpers IMAGEN (idéntico comportamiento a FotoCheck) ====

// genera un id único por celda para el input file oculto
const imageInputId = (rIdx, cIdx) => `matrizcheck-img-input-${rIdx}-${cIdx}`;

function openCameraForCell(attr, rIdx, cIdx) {
  const el = document.getElementById(imageInputId(rIdx, cIdx));
  if (el) el.click();
}

// limpia la imagen de la celda
function removeImageMatriz(attr, rIdx, cIdx) {
  const cell = attr.__editing ? attr.__draftBody?.[rIdx]?.[cIdx] : attr.body?.[rIdx]?.[cIdx];
  if (!cell) return;
  cell.galeria = [];
  cell.value = '';
}

async function onPickImageMatriz(event, attr, rIdx, cIdx) {
  const file = event.target.files?.[0];
  event.target.value = ''; // permite volver a elegir
  if (!file || !file.type.startsWith('image/')) return;

  const cell = attr.__editing ? attr.__draftBody?.[rIdx]?.[cIdx] : attr.body?.[rIdx]?.[cIdx];
  if (!cell) return;

  // compresión: si config viene como "10" => calidad 0.1
  const quality = (() => {
    const q = Number(cell.compression ?? 0.1);
    if (q <= 1) return Math.max(0.1, Math.min(1, q));
    return Math.max(0.1, Math.min(1, q / 100));
  })();

  try {
    const compressedDataUrl = await compressImageToDataURL(file, quality, 800, 800);
    // sube al backend y obtiene URL
    const dataArchivo = await uploadFileFromBase64(compressedDataUrl, file.name, file.type);
    if (dataArchivo?.data?.id_doc) {
      const obj = {
        base64: '',
        url: dataArchivo.data.url_view,
        nombre: dataArchivo.data.name_doc_interno
      };
      cell.galeria = [obj];   // igual que FotoCheck: una imagen
      cell.value = obj.nombre || 'foto';
    } else {
      console.error('No se pudo subir el archivo correctamente.');
    }
  } catch (err) {
    console.error('Error procesando imagen:', err);
  }
}

// comprime a dataURL con canvas (como FotoCheck)
function compressImageToDataURL(file, quality = 0.1, maxW = 800, maxH = 800) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        // escala manteniendo proporción
        let { width, height } = img;
        const scale = Math.min(1, maxW / width, maxH / height);
        const w = Math.round(width * scale);
        const h = Math.round(height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function base64ToFile(base64, filename, mime) {
  const arr = base64.split(',');
  const bstr = atob(arr[1] || '');
  const u8arr = new Uint8Array(bstr.length);
  for (let i = 0; i < bstr.length; i++) u8arr[i] = bstr.charCodeAt(i);
  return new File([u8arr], filename, { type: mime || 'image/jpeg' });
}

async function uploadFileFromBase64(base64Data, originalName, mimeType) {
  const file = base64ToFile(base64Data, originalName, mimeType);
  const formData = new FormData();
  formData.append('archivo', file);
  formData.append('tipo_doc', 'DOCUMENTO');
  formData.append('mimetype', file.type);
  formData.append('name_doc_orig', file.name);
  formData.append('tenant_code', 'transmac');
  formData.append('modulo', 'inspecciones');
  formData.append('id_user', 1);
  formData.append('estado', '1');

  try {
    const { data } = await apiAxios.post(
      '/v1/storage/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  } catch (error) {
    console.error('Error al subir archivo:', error);
    return null;
  }
}


// Máximo por ítem (si quieres parametrizarlo, lee attr.maxScore || 10)
const MCHECK_MAX_PER_ITEM = 10;

function normalizeCheck(v) {
  const s = (v ?? '').toString().trim().toLowerCase();
  // soporta 'si', 'sí', 'no', 'n/a' y variantes
  if (['si', 'sí'].includes(s)) return 'si';
  if (s === 'no') return 'no';
  if (s === 'n/a' || s === 'na') return 'n/a';
  return s;
}

function toNumber(val) {
  if (val === null || val === undefined) return 0;
  const s = String(val).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

// Calcula métricas en vivo (usa draft si estás editando)
function mcheckMetrics(attr) {
  const rows = attr?.__editing ? (attr.__draftBody || []) : (attr?.body || []);
  let obtenido = 0;
  let cuentaMax = 0;

  for (const row of rows) {
    if (!Array.isArray(row)) continue;

    const cellCheck = row.find(c => c?.type === 'check');
    const cellNumber = row.find(c => c?.type === 'number');

    // Puntaje obtenido: suma de la columna number
    obtenido += toNumber(cellNumber?.value);

    // Máximo: cuenta SI/NO (descarta N/A)
    const chk = normalizeCheck(cellCheck?.value);
    if (chk === 'si' || chk === 'no') cuentaMax += 1;
  }

  const maxPorItem = attr?.maxScore ?? MCHECK_MAX_PER_ITEM;
  const maximo = cuentaMax * maxPorItem;
  const desempeno = maximo > 0 ? `${Math.round((obtenido / maximo) * 100)}%` : '0%';

  return { obtenido, maximo, desempeno };
}

// total de columnas de la matriz (suma colspans de la primera fila del header)
function getMCheckColCount(attr) {
  const hdr = (attr?.headers?.[0] ?? []);
  return hdr.reduce((sum, c) => sum + (Number(c?.colspan ?? 1) || 1), 0);
}

// índice (0-based) de la columna cuyo label coincide (case-insensitive) con "Puntaje"
function puntajeColIndex(attr) {
  const hdr = (attr?.headers?.[0] ?? []);
  let idx = 0;
  for (const c of hdr) {
    const span = Number(c?.colspan ?? 1) || 1;
    const label = (c?.label ?? '').toString().trim().toLowerCase();
    if (label === 'puntaje') return idx;   // primer índice ocupado por esa celda
    idx += span;
  }
  // fallback si no se encuentra el header "Puntaje": por defecto 3 (N°, Elementos, Check, Puntaje)
  return 3;
}

function cellAlign(cell) {
  // soporta "text-align", "textAlign" y el typo "text-aling"
  const v = cell?.['text-align'] ?? cell?.textAlign ?? cell?.['text-aling'];
  if (v === 'left') return 'left';
  if (v === 'right') return 'right';
  // por defecto centrado
  return 'center';
}

// === helpers para matrizCheck ===
function getMCheckIndexes(attr) {
  // intenta detectar dinámicamente
  const firstRow = (attr.__editing ? attr.__draftBody : attr.body)?.[0] || [];
  let checkIdx = firstRow.findIndex(c => (c?.type || '').toLowerCase() === 'check');
  let numIdx = firstRow.findIndex(c => (c?.type || '').toLowerCase() === 'number');
  if (checkIdx < 0) checkIdx = 2;   // fallback
  if (numIdx < 0) numIdx = 3;   // fallback
  return { checkIdx, numIdx };
}

function ensureFooter(attr) {
  if (!Array.isArray(attr.footer)) attr.footer = [];
  // Garantiza 3 filas/objetos
  const def = [
    { label: 'Puntaje Obtenido', value: 0, colspan: 2, puntajeObtenido: 0 },
    { label: 'Puntaje Máximo', value: 0, colspan: 2, puntajeMaximo: 0 },
    { label: 'Desempeño', value: '0%', colspan: 2, desempeno: '0%' }
  ];
  for (let i = 0; i < def.length; i++) {
    if (!attr.footer[i]) attr.footer[i] = { ...def[i] };
    // llena claves si faltan
    attr.footer[i] = { ...def[i], ...attr.footer[i] };
  }
  return attr.footer;
}

function recomputeAndPersistMCheck(attr) {
  const body = (attr.__editing ? attr.__draftBody : attr.body) || [];
  const { checkIdx, numIdx } = getMCheckIndexes(attr);
  const maxPorItem = Number(attr.maxPuntaje || 10);

  let obtenido = 0;
  let maximo = 0;

  for (const row of body) {
    const c = (row?.[checkIdx]?.value ?? '').toString().trim().toUpperCase();
    const n = Number(row?.[numIdx]?.value ?? 0);
    if (Number.isFinite(n)) obtenido += n;
    if (c === 'SI' || c === 'NO') maximo += maxPorItem; // descuenta N/A
  }

  const porc = maximo > 0 ? Math.round((obtenido / maximo) * 100) : 0;

  const f = ensureFooter(attr);
  // fila 0: obtenido
  f[0].value = obtenido;
  f[0].puntajeObtenido = obtenido;

  // fila 1: máximo
  f[1].value = maximo;
  f[1].puntajeMaximo = maximo;

  // fila 2: desempeño
  f[2].value = `${porc}%`;
  f[2].desempeno = `${porc}%`;
  // opcional: valor numérico sin símbolo, por si lo quieres manipular luego
  f[2].desempenoNum = porc;
}

function isMatrizCheckComplete(attr) {
  const rows = Array.isArray(attr?.body) ? attr.body : [];
  const { checkIdx } = getMCheckIndexes(attr);
  const validChecks = ['SI', 'NO', 'N/A'];

  const rowsWithCheck = rows.filter((row) => Array.isArray(row) && row?.[checkIdx]);
  if (rowsWithCheck.length === 0) return false;

  return rowsWithCheck.every((row) =>
    validChecks.includes((row?.[checkIdx]?.value ?? '').toString().trim().toUpperCase())
  );
}

function isCheckExtintoresComplete(attr) {
  const rows = Array.isArray(attr?.body) ? attr.body : [];
  if (rows.length === 0) return false;

  return rows.every((row) => {
    const capacidadNominal = String(row?.capacidadNominal ?? '').trim();
    const potencialExtincion = String(row?.potencialExtincion ?? '').trim();
    const claseExtintor = String(row?.claseExtintor ?? '').trim();
    const ubicacion = String(row?.ubicacion ?? '').trim();
    const nroSello = String(row?.nroSello ?? '').trim();
    const fechaVencimiento = String(row?.fechaVencimiento ?? '').trim();

    const checks = row?.checks && typeof row.checks === 'object' ? row.checks : {};
    const checksCompletos = Array.from({ length: 13 }, (_, i) => {
      const raw = String(checks[`c_${i}`] ?? '').trim().toUpperCase();
      const val = raw === 'CN' ? 'NC' : raw;
      return ['C', 'NC'].includes(val);
    }).every(Boolean);

    return (
      capacidadNominal !== '' &&
      potencialExtincion !== '' &&
      checksCompletos &&
      claseExtintor !== '' &&
      ubicacion !== '' &&
      nroSello !== '' &&
      fechaVencimiento !== ''
    );
  });
}

function isCheckEppComplete(attr) {
  const rows = Array.isArray(attr?.body) ? attr.body : [];
  if (rows.length === 0) return false;

  return rows.every((row) => {
    const nombre = String(row?.nombre ?? '').trim();
    const cargo = String(row?.cargo ?? '').trim();
    const fotoOk = Array.isArray(row?.galeria) && row.galeria.length > 0;
    const items = Array.isArray(row?.items) ? row.items : [];
    if (!nombre || !cargo || items.length === 0 || !fotoOk) return false;

    const itemsOk = items.every((it) => {
      const estadoRaw = String(it?.estado ?? '').trim().toLowerCase();
      return ['b', 'm', 'bueno', 'malo', 'n/a', 'na'].includes(estadoRaw);
    });

    return itemsOk;
  });
}

function isSuperiorModeForAttr(attr) {
  const current = surveyDetailStore.surveyDetail?.[0]
  if (!current) return false
  const statusSrv = String(current.estado_srv || '').trim().toUpperCase()
  const isVerificacion = statusSrv === 'VERIFICACION' || statusSrv === 'VERIFICACIÓN' || statusSrv === 'PENDIENTE_APROBACION'
  if (!isVerificacion) return false

  let superiorId = null
  if (attr.type === 'checkListObservacionConductual') {
    superiorId = attr.datos?.superiorDerivado
  } else if (isCondicionesSeguridadType(attr.type)) {
    superiorId = attr.superiorDerivado
  }

  if (!superiorId) return false
  const currentUserId = userDetailStore.userDetail?.id_user
  return Number(superiorId) === Number(currentUserId)
}

function isObservacionConductualComplete(attr) {
  const d = attr?.datos || {};
  if (!d.centro || !String(d.servicio || '').trim() || !String(d.lugarTarea || '').trim()) return false;
  if (d.cantidadPersonas === null || d.cantidadPersonas === undefined || d.cantidadPersonas === '') return false;
  if (!d.tipoConducta) return false;
  
  if (d.tipoConducta === 'RIESGOSA') {
    if (!d.causaRiesgosa) return false;
    if (d.causaRiesgosa === 'Otros' && !String(d.otraCausa || '').trim()) return false;

    // Lógica de obligatoriedad del Cierre / Derivación
    const isSuperior = isSuperiorModeForAttr(attr);

    if (!isSuperior) {
      if (!d.cerrarInSitu) return false;
    }

    if (d.cerrarInSitu === 'SI' || isSuperior) {
      if (!String(d.comentariosCierre || '').trim()) return false;
    } else if (d.cerrarInSitu === 'NO' && !isSuperior) {
      if (!d.superiorDerivado) return false;
      if (!String(d.fechaCompromiso || '').trim()) return false;
    }
  }
  
  if (!String(d.descripcion || '').trim() || !String(d.medidasControl || '').trim()) return false;
  if (!d.gps || d.gps.lat === null || d.gps.lng === null || d.gps.lat === undefined || d.gps.lng === undefined) return false;
  
  return true;
}

function isCondicionesSeguridadComplete(attr) {
  const blocks = Array.isArray(attr.blocks) ? attr.blocks : []
  if (blocks.length === 0) return false

  for (const block of blocks) {
    if (!block.aplica) return false
    if (block.aplica === 'aplica') {
      const items = Array.isArray(block.items) ? block.items : []
      for (const item of items) {
        if (!item.estado) return false
        const estado = String(item.estado).toUpperCase()
        if (estado === 'I' || estado === 'RI') {
          if (!item.severidad) return false
        }
        if (item.isOtros || estado === 'I' || estado === 'RI') {
          if (!String(item.observacion || '').trim()) return false
        }
      }
    }
  }

  // Validar también los campos de Cierre / Derivación si hay desviaciones o Modo Superior
  const hasDesviacion = blocks.some(block =>
    block.aplica === 'aplica' &&
    (block.items || []).some(item => item.estado === 'I')
  )

  const isSuperior = isSuperiorModeForAttr(attr);

  if (hasDesviacion || isSuperior) {
    if (!isSuperior) {
      if (!attr.cerrarInSitu) return false
    }

    if (attr.cerrarInSitu === 'SI' || isSuperior) {
      if (!Array.isArray(attr.fotosCierre) || attr.fotosCierre.length === 0) return false
      if (!String(attr.comentariosCierre || '').trim()) return false
    } else if (attr.cerrarInSitu === 'NO' && !isSuperior) {
      if (!attr.superiorDerivado) return false
      if (!String(attr.fechaCompromiso || '').trim()) return false
      const numFotos = Array.isArray(attr.fotosHallazgo) ? attr.fotosHallazgo.length : 0;
      if (numFotos < 2 || numFotos > 8) {
        return false;
      }
    }
  }

  return true;
}

function validarMatrizCheckRequerida() {
  const faltantes = [];

  surveyDetailStore.surveyDetail.forEach((survey) => {
    const segmentos = getSegmentos(survey);
    (segmentos || []).forEach((seg) => {
      (seg.attributes || []).forEach((attr) => {
        if (attr?.type !== 'matrizCheck') return;
        if (!isMatrizCheckComplete(attr)) {
          faltantes.push(`• ${seg?.label || 'Segmento sin nombre'}`);
        }
      });
    });
  });

  if (faltantes.length) {
    const proceed = confirm(
      'Debes responder todos los checks antes de pasar a flujo.\n\n' +
      faltantes.join('\n') +
      '\n\n¿Deseas continuar a firma de todas formas? (Bypass de desarrollo/pruebas)'
    );
    return proceed;
  }

  return true;
}

const isTemplate110 = computed(() => surveyDetailStore.surveyDetail?.[0]?.id_template === 110);
const isConexionActual = computed(() => {
  const s = surveyDetailStore.surveyDetail?.[0]
  return isConexionSurvey(s)
})
const isGuardarFlotanteConexion = computed(() => hasCnxRole.value || isConexionActual.value)

function isBlockedFotoCheck(attr) {
  if (!isTemplate110.value) return false;

  // Lista de items a bloquear si no es SI
  if (['Charla', 'ATS', 'T. Altura'].includes(attr.label)) {
    // Si selecciona cualquier cosa distinta de "si" (incluyendo vacío), se bloquea la foto
    return attr.default !== 'si';
  }
  return false;
}

// 1) NUEVO: valida que TODOS los photoCapture tengan al menos 1 foto
function validarFotosRequeridas() {
  const faltantes = [];

  surveyDetailStore.surveyDetail.forEach(survey => {
    const segmentos = getSegmentos(survey);
    (segmentos || []).forEach(seg => {
      (seg.attributes || []).forEach(attr => {
        if (attr?.type === 'photoCapture') {
          const req = Number(0);     // por defecto 1
          const tiene = Array.isArray(attr.galeria) ? attr.galeria.length : 0;

          // Si quieres que solo sea obligatorio cuando req > 0, usa: if (req > 0 && tiene < req)
          if (tiene < req) {
            faltantes.push(`• ${seg.label} (mín: ${req}, tiene: ${tiene})`);
          }
        }
      });
    });
  });

  if (faltantes.length) {
    alert(
      'Faltan fotos obligatorias en los siguientes ítems:\n\n' +
      faltantes.join('\n')
    );
    return false;
  }
  return true;
}

// === PPD: helpers para modo solo visual ===

// Detecta si el survey es PPD (ajusta condiciones si cambian los códigos)
function isPPDTemplate(survey) {
  if (!survey) return false;
  return (
    survey.codi_template_srv === 'PPD' ||
    survey.name_template_srv === 'Parte Producción Diaria' ||
    survey.codi_tipo_srv === 'PP'
  );
}

// body_exec puede venir string u objeto
function getBodyExecPPD(survey) {
  if (!survey) return null;
  const body = typeof survey.body_exec === 'string'
    ? (() => { try { return JSON.parse(survey.body_exec); } catch { return null; } })()
    : survey.body_exec;
  return body || null;
}

// Tareas PPD: se asume body.task (como en el print)
function getTasksPPD(survey) {
  const body = getBodyExecPPD(survey);
  if (body && Array.isArray(body.task)) return body.task;
  if (Array.isArray(body)) return body; // fallback por si algún día viene así
  return [];
}

// Agrupa tareas por cuadrilla y calcula totales
function getCuadrillasPPD(survey) {
  const tasks = getTasksPPD(survey);
  const map = {};

  tasks.forEach(t => {
    const key = t.cuadrilla || 'Sin cuadrilla';
    if (!map[key]) {
      map[key] = {
        cuadrilla: key,
        tareas: [],
        partidas: 0,
        totalHoras: 0
      };
    }
    map[key].tareas.push(t);
    map[key].partidas++;

    const personas = Array.isArray(t.assigned_personnel) ? t.assigned_personnel : [];
    personas.forEach(p => {
      const h = Number(p.horas);
      if (Number.isFinite(h)) {
        map[key].totalHoras += h;
      }
    });
  });

  return Object.values(map);
}

function docUrl(attr) {
  // Soporta 2 formas:
  // 1) attr.src ya viene listo (URL o /archivo/...)
  // 2) attr.src viene como "terracon/archivo.pdf" o "subcarpeta/archivo.pdf"
  // 3) attr.id_doc (si después quieres resolverlo por API, por ahora solo lo mostramos)

  const src = (attr?.src ?? '').toString().trim();
  if (src) {
    // Si ya viene URL absoluta o ruta /archivo/...
    if (src.startsWith('http')) return src;
    if (src.startsWith('/archivo/')) return src;

    // Si viene "terracon/loquesea.pdf"
    const parts = src.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const subcarpeta = parts[0];
      const nombre = parts.slice(1).join('/');
      return `/archivo/${subcarpeta}/${nombre}`;
    }
  }

  // Si no hay src, no hay cómo mostrarlo (por ahora)
  return '';
}

function abrirDoc(attr) {
  const url = docUrl(attr);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function isExcludedAttribute(attr) {
  const label = normalizeSegmentLabel(attr?.label ?? attr?.text ?? '');
  if (label === 'valor servicio') return true;
  if (label.includes('referencia') && label.includes('direccion')) return true;
  return false;
}

function getVisibleAttributes(attrs) {
  return (attrs || []).filter(attr => !isExcludedAttribute(attr));
}

function normalizeTypeKey(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

function isCondicionesSeguridadType(type) {
  const t = normalizeTypeKey(type)
  return [
    'condicionesseguridadtrabajo',
    'condiciones seguridad trabajo',
    'condiciones de seguridad en trabajos',
    'cond seg trabajo',
    'condicionesseguridadentrabajos'
  ].includes(t)
}

function getVisibleAttributesBySegment(segmento) {
  if (!segmento) return [];

  // Fallback: si el JSON se guardó al nivel del segmento (sin attributes[]), lo inyectamos permanentemente
  if ((!Array.isArray(segmento.attributes) || segmento.attributes.length === 0) &&
      (isCondicionesSeguridadType(segmento.type) || normalizeSegmentLabel(segmento.label) === 'condiciones de seguridad en trabajos')) {
    segmento.attributes = [{
      type: 'condicionesSeguridadTrabajo',
      label: segmento.label || 'CONDICIONES DE SEGURIDAD EN TRABAJOS',
      nullable: true,
      blocks: Array.isArray(segmento.blocks) ? segmento.blocks : []
    }];
  }

  const rawAttrs = segmento.attributes
  const baseAttrs = Array.isArray(rawAttrs)
    ? rawAttrs
    : (rawAttrs && typeof rawAttrs === 'object' ? [rawAttrs] : [])

  const attrs = getVisibleAttributes(baseAttrs);

  if (!isReclamosConSurveySegment(segmento)) return attrs;

  const idxObservacionProblema = attrs.findIndex(attr => {
    const raw = attr?.label ?? attr?.text ?? '';
    const norm = normalizeSegmentLabel(raw);
    return norm.includes('observacion') && norm.includes('problema');
  });

  if (idxObservacionProblema >= 0) {
    return attrs.slice(0, idxObservacionProblema);
  }

  const idxSlaReal = attrs.findIndex(attr => {
    const raw = attr?.label ?? attr?.text ?? '';
    return normalizeSegmentLabel(raw) === 'sla real';
  });

  if (idxSlaReal < 0) return attrs;
  return attrs.slice(0, idxSlaReal + 1);
}

function normalizeSegmentLabel(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isReclamosConSurveySegment(segmento) {
  const label = normalizeSegmentLabel(segmento?.label);
  return label === 'reclamos (con survey)' || label === 'reclamos con survey';
}

function isAttributeAnswered(attr, survey) {
  if (!attr) return false;
  const type = attr.type || '';
  
  if (['newLine', 'labelLine', 'labelLineH1', 'labelLineH2', 'labelLineH3', 'labelLineH4', 'labelLineH5'].includes(type)) {
    return null; // Separador / cabecera, no es pregunta
  }
  
  if (isExcludedAttribute(attr)) {
    return null; // Excluido del conteo
  }

  // Atributos de sistema con fallback (ej. Nombre obra, Dirección obra)
  if (attr.roles && attr.roles.includes('SYSTEM')) {
    const val = getSystemFieldValue(attr, survey);
    return val !== undefined && val !== null && String(val).trim() !== '';
  }

  if (['textField', 'number', 'decimal', 'datePicker', 'dateHourPicker', 'textArea'].includes(type)) {
    return attr.default !== undefined && attr.default !== null && String(attr.default).trim() !== '';
  }

  if (type === 'radioButton') {
    return attr.default !== undefined && attr.default !== null && String(attr.default).trim() !== '';
  }

  if (type === 'comboBox') {
    const selected = attr.values?.selected;
    const def = attr.default;
    return (selected !== undefined && selected !== null && String(selected).trim() !== '') ||
           (def !== undefined && def !== null && String(def).trim() !== '');
  }

  if (['photoCheck', 'fotoCheck', 'photo_check', 'foto_check'].includes(type)) {
    const hasDef = attr.default !== undefined && attr.default !== null && String(attr.default).trim() !== '';
    const hasVal = attr.value !== undefined && attr.value !== null && String(attr.value).trim() !== '';
    const hasCant = attr.cantidad !== undefined && attr.cantidad !== null && String(attr.cantidad).trim() !== '';
    const hasFec = attr.fechaVencimiento !== undefined && attr.fechaVencimiento !== null && String(attr.fechaVencimiento).trim() !== '';
    return hasDef || hasVal || hasCant || hasFec;
  }

  if (type === 'geoLocation') {
    return Boolean(
      (attr.geoVisita && attr.geoVisita.lat) ||
      (attr.default && typeof attr.default === 'object' && (attr.default.lat || attr.default.geoVisita?.lat)) ||
      (attr.value && typeof attr.value === 'object' && attr.value.lat)
    );
  }

  if (type === 'signature') {
    return attr.default !== undefined && attr.default !== null && String(attr.default).trim().length > 0;
  }

  if (['fotoCapture', 'photoCapture', 'photo', 'foto'].includes(type)) {
    const galeria = attr.galeria || attr.default?.galeria || attr.default;
    return Array.isArray(galeria) ? galeria.length > 0 : Boolean(attr.src || attr.default);
  }

  if (['croquisCapture', 'croquis'].includes(type)) {
    return attr.default !== undefined && attr.default !== null && String(attr.default).trim().length > 0;
  }

  if (type === 'checkList') {
    const items = Array.isArray(attr.checkBoby) ? attr.checkBoby : [];
    if (items.length === 0) return true;
    return items.every(item => item.nullable === true || (item.default !== undefined && item.default !== null && String(item.default).trim() !== ''));
  }

  if (['checkListTecles', 'checkListTecle', 'CHECK LIST TECLES'].includes(type)) {
    const items = Array.isArray(attr.checkBoby) ? attr.checkBoby : [];
    if (items.length === 0) return true;
    return items.every(check => (check?.default ?? '').toString().trim() !== '');
  }

  if (type === 'matrizCheck') {
    return isMatrizCheckComplete(attr);
  }

  if (attr.default !== undefined && attr.default !== null && String(attr.default).trim() !== '') {
    return true;
  }
  return false;
}

function getSegmentProgress(segmento, survey) {
  if (!segmento) return { total: 0, filled: 0, percentage: 0, isComplete: false };

  const rawAttrs = getVisibleAttributesBySegment(segmento);
  let total = 0;
  let filled = 0;

  rawAttrs.forEach(attr => {
    const status = isAttributeAnswered(attr, survey);
    if (status !== null) {
      total++;
      if (status === true) filled++;
    }
  });

  if (total === 0) {
    return { total: 0, filled: 0, percentage: 100, isComplete: true };
  }

  const percentage = Math.min(100, Math.round((filled / total) * 100));
  const isComplete = filled >= total;

  return { total, filled, percentage, isComplete };
}



const isTemplate101 = computed(() => {
  const s = surveyDetailStore.surveyDetail?.[0]
  return Number(s?.id_template) === 101 || Number(s?.id_template) === 103 || Number(s?.id_template) === 104 || Number(s?.id_template) === 105
})
</script>
<style scoped>
.sombra-resaltada {
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3) !important;
  border-radius: 12px;
}

/* Quitar padding en el expansion panel */
::v-deep(.v-expansion-panel-text__wrapper) {
  padding-left: 5px !important;
  padding-top: 0px !important;
  padding-bottom: 0px !important;
  padding-right: 5px !important;
}

.color-red input {
  border-color: red !important;
}

.text-custom-red {
  color: #f87171 !important;
}

.protocol-inspection-view {
  color: #e5eefb;
}

.protocol-inspection-view :deep(.v-expansion-panel) {
  background: #101827 !important;
  color: #e5eefb !important;
  border: 1px solid rgba(16, 185, 129, 0.42);
  border-radius: 12px !important;
  overflow: hidden;
}

.protocol-inspection-view :deep(.v-expansion-panel-title) {
  color: #e5eefb !important;
  min-height: 48px;
}

.protocol-inspection-view :deep(.v-expansion-panel-title__overlay) {
  opacity: 0 !important;
}

.protocol-inspection-view :deep(.v-expansion-panel-text) {
  color: #e5eefb !important;
}

.protocol-inspection-view :deep(.bg-white),
.protocol-inspection-view :deep(.v-input.bg-white) {
  background-color: transparent !important;
  color: #e5eefb !important;
}

.protocol-inspection-view :deep(.v-field) {
  color: #e5eefb !important;
  background: #0f172a !important;
  border-radius: 10px;
  box-shadow: none !important;
}

.protocol-inspection-view :deep(.v-field__outline) {
  color: rgba(52, 211, 153, 0.62) !important;
}

.protocol-inspection-view :deep(.v-field__overlay) {
  background: transparent !important;
  opacity: 0 !important;
}

.protocol-inspection-view :deep(.v-field__input),
.protocol-inspection-view :deep(input),
.protocol-inspection-view :deep(textarea),
.protocol-inspection-view :deep(.v-label),
.protocol-inspection-view :deep(.v-field-label),
.protocol-inspection-view :deep(.v-select__selection-text) {
  color: #e5eefb !important;
  opacity: 1 !important;
}

.protocol-inspection-view :deep(input::placeholder),
.protocol-inspection-view :deep(textarea::placeholder) {
  color: #9fb0c7 !important;
  opacity: 1 !important;
}

.protocol-inspection-view :deep(.v-select .v-icon),
.protocol-inspection-view :deep(.v-field__append-inner .v-icon),
.protocol-inspection-view :deep(.v-field__clearable .v-icon) {
  color: #d1fae5 !important;
  opacity: 1 !important;
}

.protocol-inspection-view :deep(.v-field--disabled) {
  opacity: 1 !important;
  background: #111827 !important;
}

.protocol-inspection-view :deep(.v-field--disabled input),
.protocol-inspection-view :deep(.v-field--disabled textarea),
.protocol-inspection-view :deep(.v-field--disabled .v-field__input) {
  color: #cbd5e1 !important;
  -webkit-text-fill-color: #cbd5e1 !important;
}

.inspeccion-action-btn {
  background: linear-gradient(90deg, #047857 0%, #059669 42%, #10b981 100%) !important;
  color: #ffffff !important;
  border: 1px solid rgba(255, 255, 255, 0.25);
  min-height: 48px;
  border-radius: 10px !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
}

.inspeccion-action-btn :deep(.v-btn__content) {
  color: #ffffff !important;
  font-size: 0.92rem;
  line-height: 1.2;
  white-space: normal;
  text-align: center;
}

.inspeccion-action-btn--floating {
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(12px + env(safe-area-inset-bottom));
  z-index: 10;
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.35) !important;
}

.segment-header {
  background: linear-gradient(180deg, #172136 0%, #111827 100%) !important;
  border-left: 4px solid #10b981;
  border-bottom: 1px solid rgba(52, 211, 153, 0.35);
  color: #e5eefb !important;
  font-weight: 800 !important;
  letter-spacing: 0 !important;
}

.segment-body {
  background: #0b1220 !important;
  color: #e5eefb !important;
}

.segment-body-readonly {
  pointer-events: none;
}

.checklist-item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
}

.checklist-item-label {
  line-height: 1.35;
  padding-top: 6px;
  color: #e5eefb;
}

.checklist-toggle {
  border: 1px solid rgba(52, 211, 153, 0.45);
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.12);
  padding: 2px;
}

.checklist-toggle-btn {
  min-width: 52px;
  font-weight: 700;
  color: #d1fae5;
  background: #0f172a;
  border-radius: 8px;
}

.checklist-toggle :deep(.v-btn--active) {
  background: #059669 !important;
  color: #ffffff !important;
}

.conexion-header-compact {
  border: 1px solid #c8d7f2;
  border-radius: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #f2f7ff 100%);
  box-shadow: 0 5px 16px rgba(24, 58, 112, 0.12);
  padding: 10px;
}

.conexion-header-compact__meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.conexion-header-compact__chip {
  display: inline-flex;
  align-items: center;
  border: 1px solid #c8d7f2;
  border-radius: 999px;
  background: #ffffff;
  color: #1e2f4a;
  font-size: 12px;
  line-height: 1;
  font-weight: 700;
  padding: 6px 10px;
}

.conexion-header-compact__chip--accent {
  background: #e8f0ff;
  border-color: #99b8f3;
  color: #1c4db3;
}

.conexion-header-compact__address {
  background: #ffffff;
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  color: #132238;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  padding: 8px 10px;
  margin-bottom: 8px;
  white-space: normal;
  word-break: break-word;
}

.conexion-header-compact__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.conexion-header-compact__item {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d8e3f7;
  border-radius: 10px;
  padding: 7px 9px;
  min-width: 0;
}

.conexion-header-compact__label {
  display: block;
  color: #2768a8;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 2px;
}

.conexion-header-compact__value {
  display: block;
  color: #1d2f4a;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.2;
  white-space: normal;
  word-break: break-word;
}

.conexion-header-simple {
  border: 1px solid #b9c8da;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 3px 10px rgba(15, 23, 42, 0.12);
  padding: 8px;
  display: grid;
  gap: 6px;
}

.conexion-header-simple__top {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.conexion-header-simple__meta-pill {
  font-size: 0.72rem;
  font-weight: 700;
  color: #1e293b;
  border: 1px solid #dbe3ef;
  border-radius: 999px;
  padding: 2px 6px;
  text-align: center;
  background: #f8fafc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conexion-header-simple__address {
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.2;
  color: #0f172a;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 6px 8px;
  text-transform: uppercase;
  white-space: normal;
  word-break: break-word;
}

.conexion-header-simple__people {
  display: grid;
  grid-template-columns: 1fr;
  gap: 4px;
}

.conexion-header-simple__person-line {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.conexion-header-simple__label-inline {
  font-size: 0.66rem;
  font-weight: 700;
  color: #0f766e;
  text-transform: uppercase;
}

.conexion-header-simple__value-inline {
  font-size: 0.78rem;
  font-weight: 700;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conexion-header-simple__value-inline--multiline {
  white-space: normal;
  overflow: visible;
  text-overflow: clip;
  word-break: break-word;
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

@media (max-width: 600px) {
  .conexion-header-compact {
    padding: 9px;
    border-radius: 12px;
  }

  .conexion-header-compact__address {
    font-size: 17px;
  }

  .conexion-header-compact__grid {
    grid-template-columns: 1fr;
  }

  .conexion-header-simple {
    padding: 7px;
    gap: 5px;
  }

  .conexion-header-simple__meta-pill {
    font-size: 0.68rem;
    padding: 2px 5px;
  }

  .conexion-header-simple__address {
    font-size: 0.8rem;
  }

}
</style>
