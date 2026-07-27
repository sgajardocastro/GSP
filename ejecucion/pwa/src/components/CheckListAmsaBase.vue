<template>
  <div class="checklist-amsa-base">
    <div v-if="config.showTitle === true" class="double-header">{{ config.title }}</div>

    <v-row dense class="mb-3">
      <v-col v-for="field in config.headerFields || []" :key="field.key" cols="12" sm="6">
        <v-text-field
          :model-value="getDato(field.key)"
          :type="field.type || 'text'"
          :label="field.label"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setDato(field.key, value)"
        />
      </v-col>
    </v-row>

    <div v-if="shouldShowReferenceImages('top')" class="reference-grid">
      <figure v-for="image in config.referenceImages" :key="image.src" class="reference-card">
        <figcaption v-if="image.title" class="reference-title">{{ image.title }}</figcaption>
        <img :src="assetUrl(image.src)" :alt="image.alt || config.title" @error="hideBrokenImage" />
      </figure>
    </div>

    <section v-for="group in config.groups" :key="group.id" class="section-block">
      <button type="button" class="section-title" @click="toggleSection(group.id)">
        <span>{{ group.title }}</span>
        <span class="section-actions">
          <span class="answered-count">{{ getGroupAnswered(group.id) }}/{{ getGroupTotal(group) }}</span>
          <v-icon size="18">{{ isOpen(group.id) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </span>
      </button>

      <div v-show="isOpen(group.id)" class="section-body">
        <figure v-if="group.image" class="reference-card section-reference-card">
          <figcaption v-if="group.image.title" class="reference-title">{{ group.image.title }}</figcaption>
          <img :src="assetUrl(group.image.src)" :alt="group.image.alt || group.title" />
        </figure>

        <article v-for="item in group.items" v-show="!['matrix-sino', 'eppu-personas', 'ubicacion-items', 'repeat-fields'].includes(group.stateType)" :key="item.id" class="item-card">
          <strong>{{ item.label }}</strong>

          <template v-if="group.stateType === 'multi-sino'">
            <div class="column-grid">
              <div v-for="column in group.columns" :key="column" class="column-check">
                <span>{{ column }}</span>
                <div :class="['state-row', getColumnStates(item).length === 2 ? 'state-row--two' : 'state-row--three']">
                  <button
                    v-for="state in getColumnStates(item)"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', getColumnValue(group.id, item.id, column) === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setColumnValue(group.id, item.id, column, state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="group.stateType === 'semanal' || group.stateType === 'semanal-sinona'">
            <div class="column-grid">
              <div v-for="day in weekDays" :key="day.value" class="column-check">
                <span>{{ day.label }}</span>
                <div class="state-row state-row--three">
                  <button
                    v-for="state in getWeeklyStates(group.stateType)"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', getColumnValue(group.id, item.id, day.value) === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setColumnValue(group.id, item.id, day.value, state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="group.stateType === 'date'">
            <v-text-field
              :model-value="getItemValue(group.id, item.id)"
              label="Fecha de vencimiento"
              type="date"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="(value) => setDirectItemValue(group.id, item.id, value)"
            />
          </template>

          <template v-else-if="group.stateType === 'dispestado'">
            <div class="split-state">
              <div>
                <span>Disponible</span>
                <div class="state-row state-row--two">
                  <button
                    v-for="state in statesSiNo"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', getExtraValue(group.id, item.id, 'disponible') === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setExtraValue(group.id, item.id, 'disponible', state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
              <div>
                <span>Estado</span>
                <div class="state-row state-row--three">
                  <button
                    v-for="state in statesBmna"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', getItemValue(group.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setItemValue(group.id, item.id, state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else-if="group.stateType === 'eppu'">
            <div class="split-state">
              <div>
                <span>Estado</span>
                <div class="state-row state-row--three">
                  <button
                    v-for="state in statesBrm"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', getItemValue(group.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setItemValue(group.id, item.id, state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
              <div>
                <span>Utiliza</span>
                <div class="state-row state-row--three">
                  <button
                    v-for="state in statesSiNoNa"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', getExtraValue(group.id, item.id, 'utiliza') === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setExtraValue(group.id, item.id, 'utiliza', state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <div :class="['state-row', getStates(group.stateType).length === 2 ? 'state-row--two' : 'state-row--three']">
              <button
                v-for="state in getStates(group.stateType)"
                :key="state.value"
                type="button"
                :disabled="disabled"
                :class="['state-toggle', getItemValue(group.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
                @click="setItemValue(group.id, item.id, state.value)"
              >
                {{ state.label }}
              </button>
            </div>
          </template>

          <v-row v-if="config.itemDetailFields" dense class="item-detail-fields">
            <v-col cols="12" md="4">
              <v-textarea
                :model-value="getExtraValue(group.id, item.id, 'descripcionEstado')"
                label="Descripcion estado"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setExtraTextValue(group.id, item.id, 'descripcionEstado', value)"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-textarea
                :model-value="getExtraValue(group.id, item.id, 'accionRealizar')"
                label="Accion a realizar"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setExtraTextValue(group.id, item.id, 'accionRealizar', value)"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                :model-value="getExtraValue(group.id, item.id, 'responsable')"
                label="Responsable"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setExtraTextValue(group.id, item.id, 'responsable', value)"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                :model-value="getExtraValue(group.id, item.id, 'fechaEjecucion')"
                label="Fecha ejecucion"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="(value) => setExtraTextValue(group.id, item.id, 'fechaEjecucion', value)"
              />
            </v-col>
          </v-row>

          <v-textarea
            v-else
            :model-value="getItemObservation(group.id, item.id)"
            label="Observacion"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="(value) => setItemObservation(group.id, item.id, value)"
          />
        </article>

        <section v-if="group.stateType === 'eppu-personas'" class="person-section">
          <article v-for="(person, personIndex) in getEppPersonRows(group.id)" :key="person.id" class="deviation-card epp-person-card">
            <div class="deviation-head">
              <div class="deviation-number">{{ getEppPersonTitle(person, personIndex) }}</div>
              <div class="person-card-actions">
                <v-btn
                  :icon="person.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                  size="small"
                  variant="tonal"
                  color="info"
                  class="collapse-btn"
                  :disabled="disabled"
                  @click="toggleEppPersonCollapsed(group.id, person.id)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="tonal"
                  color="error"
                  class="delete-btn"
                  :disabled="disabled || getEppPersonRows(group.id).length <= 1"
                  @click="removeEppPersonRow(group.id, personIndex)"
                />
              </div>
            </div>

            <v-text-field
              v-show="!person.collapsed"
              v-model="person.nombreApellido"
              label="Nombre apellido"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="touch"
            />

            <v-textarea
              v-show="!person.collapsed"
              v-model="person.observacion"
              label="Observacion"
              variant="outlined"
              density="compact"
              rows="2"
              auto-grow
              hide-details
              :disabled="disabled"
              @update:model-value="touch"
            />

            <div v-show="!person.collapsed" class="epp-person-items">
              <div v-for="item in group.items" :key="item.id" class="epp-person-item">
                <strong>{{ item.label }}</strong>
                <div class="split-state">
                  <div>
                    <span>Estado</span>
                    <div class="state-row state-row--three">
                      <button
                        v-for="state in statesBrm"
                        :key="state.value"
                        type="button"
                        :disabled="disabled"
                        :class="['state-toggle', getEppPersonValue(group.id, person.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
                        @click="setEppPersonValue(group.id, person.id, item.id, state.value)"
                      >
                        {{ state.label }}
                      </button>
                    </div>
                  </div>
                  <div>
                    <span>Utiliza</span>
                    <div class="state-row state-row--three">
                      <button
                        v-for="state in statesSiNoNa"
                        :key="state.value"
                        type="button"
                        :disabled="disabled"
                        :class="['state-toggle', getEppPersonExtra(group.id, person.id, item.id, 'utiliza') === state.value ? `state-toggle--${state.value}` : '']"
                        @click="setEppPersonExtra(group.id, person.id, item.id, 'utiliza', state.value)"
                      >
                        {{ state.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>

          <div class="deviation-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addEppPersonRow(group.id)"
            >
              Agregar
            </v-btn>
          </div>
        </section>

        <section v-if="group.stateType === 'ubicacion-items'" class="person-section">
          <article v-for="(row, rowIndex) in getLocationRows(group.id)" :key="row.id" class="deviation-card epp-person-card">
            <div class="deviation-head">
              <div class="deviation-number">{{ getLocationRowTitle(row, rowIndex) }}</div>
              <div class="person-card-actions">
                <v-btn
                  :icon="row.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                  size="small"
                  variant="tonal"
                  color="info"
                  class="collapse-btn"
                  :disabled="disabled"
                  @click="toggleLocationRowCollapsed(group.id, row.id)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="tonal"
                  color="error"
                  class="delete-btn"
                  :disabled="disabled || getLocationRows(group.id).length <= 1"
                  @click="removeLocationRow(group.id, rowIndex)"
                />
              </div>
            </div>

            <v-text-field
              v-show="!row.collapsed"
              v-model="row.ubicacion"
              label="Ubicacion"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="touch"
            />

            <div v-show="!row.collapsed" class="epp-person-items">
              <div v-for="item in group.items" :key="item.id" class="epp-person-item">
                <strong>{{ item.label }}</strong>
                <div :class="['state-row', getStates(group.repeatStateType || 'sino').length === 2 ? 'state-row--two' : 'state-row--three']">
                  <button
                    v-for="state in getStates(group.repeatStateType || 'sino')"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', getLocationItemValue(group.id, row.id, item.id) === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setLocationItemValue(group.id, row.id, item.id, state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
            </div>
          </article>

          <div class="deviation-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addLocationRow(group.id)"
            >
              Agregar
            </v-btn>
          </div>
        </section>

        <section v-if="group.stateType === 'repeat-fields'" class="person-section">
          <article v-for="(row, rowIndex) in getRepeatFieldRows(group.id)" :key="row.id" class="deviation-card epp-person-card">
            <div class="deviation-head">
              <div class="deviation-number">{{ getRepeatFieldRowTitle(group, row, rowIndex) }}</div>
              <div class="person-card-actions">
                <v-btn
                  :icon="row.collapsed ? 'mdi-chevron-down' : 'mdi-chevron-up'"
                  size="small"
                  variant="tonal"
                  color="info"
                  class="collapse-btn"
                  :disabled="disabled"
                  @click="toggleRepeatFieldRowCollapsed(group.id, row.id)"
                />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="tonal"
                  color="error"
                  class="delete-btn"
                  :disabled="disabled || getRepeatFieldRows(group.id).length <= 1"
                  @click="removeRepeatFieldRow(group.id, rowIndex)"
                />
              </div>
            </div>

            <div v-show="!row.collapsed" class="repeat-field-grid">
              <template v-for="field in group.fields" :key="field.key">
                <div v-if="field.type === 'sino'" class="repeat-field-toggle">
                  <span>{{ field.label }}</span>
                  <div class="state-row state-row--two">
                    <button
                      v-for="state in statesSiNo"
                      :key="state.value"
                      type="button"
                      :disabled="disabled"
                      :class="['state-toggle', row.values?.[field.key] === state.value ? `state-toggle--${state.value}` : '']"
                      @click="setRepeatFieldValue(group.id, row.id, field.key, state.value, true)"
                    >
                      {{ state.label }}
                    </button>
                  </div>
                </div>
                <v-text-field
                  v-else
                  :model-value="row.values?.[field.key] ?? ''"
                  :type="field.type || 'text'"
                  :label="field.label"
                  variant="outlined"
                  density="compact"
                  hide-details
                  :disabled="disabled"
                  @update:model-value="(value) => setRepeatFieldValue(group.id, row.id, field.key, value)"
                />
              </template>
            </div>
          </article>

          <div class="deviation-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addRepeatFieldRow(group.id)"
            >
              Agregar
            </v-btn>
          </div>
        </section>

        <section v-if="group.stateType === 'matrix-sino'" class="matrix-section">
          <article v-for="(row, index) in getMatrixRows(group.id)" :key="row.id" class="deviation-card matrix-row-card">
            <div class="deviation-head">
              <div class="deviation-number">{{ group.rowLabel || 'N°' }} {{ index + 1 }}</div>
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="tonal"
                color="error"
                class="delete-btn"
                :disabled="disabled || getMatrixRows(group.id).length <= 1"
                @click="removeMatrixRow(group.id, index)"
              />
            </div>

            <v-text-field
              v-model="row.codigo"
              :label="group.rowLabel || 'N°'"
              variant="outlined"
              density="compact"
              hide-details
              :disabled="disabled"
              @update:model-value="touch"
            />

            <div class="matrix-criteria">
              <div v-for="criterion in group.criteria" :key="criterion.id" class="matrix-criterion">
                <strong>{{ criterion.label }}</strong>
                <div class="state-row state-row--two">
                  <button
                    v-for="state in statesSiNo"
                    :key="state.value"
                    type="button"
                    :disabled="disabled"
                    :class="['state-toggle', row.estados?.[criterion.id] === state.value ? `state-toggle--${state.value}` : '']"
                    @click="setMatrixValue(group.id, row.id, criterion.id, state.value)"
                  >
                    {{ state.label }}
                  </button>
                </div>
              </div>
            </div>
          </article>

          <div class="deviation-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addMatrixRow(group.id)"
            >
              Agregar
            </v-btn>
          </div>
        </section>

        <section v-if="config.groupDeviationsTable" class="deviations-section deviations-section--group">
          <div class="deviation-cards">
            <article v-for="(row, index) in getGroupDeviations(group.id)" :key="row.id" class="deviation-card">
              <div class="deviation-head">
                <div class="deviation-number">Item {{ index + 1 }}</div>
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="tonal"
                  color="error"
                  class="delete-btn"
                  :disabled="disabled || getGroupDeviations(group.id).length <= 1"
                  @click="removeGroupDeviation(group.id, index)"
                />
              </div>

              <v-textarea
                v-model="row.desviacion"
                label="Desviaciones detectadas"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="touch"
              />

              <v-textarea
                v-model="row.accionCorrectiva"
                label="Accion correctiva"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details
                :disabled="disabled"
                @update:model-value="touch"
              />

              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="row.responsable"
                    label="RESPONSABLE"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="disabled"
                    @update:model-value="touch"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="row.fechaEjecucion"
                    label="FECHA DE EJECUCION"
                    type="date"
                    variant="outlined"
                    density="compact"
                    hide-details
                    :disabled="disabled"
                    @update:model-value="touch"
                  />
                </v-col>
              </v-row>
            </article>
          </div>

          <div class="deviation-actions">
            <v-btn
              size="small"
              variant="tonal"
              color="success"
              prepend-icon="mdi-plus"
              :disabled="disabled"
              @click="addGroupDeviation(group.id)"
            >
              Agregar
            </v-btn>
          </div>
        </section>
      </div>
    </section>

    <v-row v-if="(config.footerFields || []).length" dense class="mb-3">
      <v-col v-for="field in config.footerFields" :key="field.key" cols="12" sm="6">
        <v-text-field
          :model-value="getDato(field.key)"
          :type="field.type || 'text'"
          :label="field.label"
          variant="outlined"
          density="compact"
          hide-details
          :disabled="disabled"
          @update:model-value="(value) => setDato(field.key, value)"
        />
      </v-col>
    </v-row>

    <section v-if="config.deviationsTable" class="deviations-section">
      <div class="deviation-cards">
        <article v-for="(row, index) in getDeviations()" :key="row.id" class="deviation-card">
          <div class="deviation-head">
            <div class="deviation-number">Item {{ index + 1 }}</div>
            <v-btn
              icon="mdi-delete"
              size="small"
              variant="tonal"
              color="error"
              class="delete-btn"
              :disabled="disabled || getDeviations().length <= 1"
              @click="removeDeviation(index)"
            />
          </div>

          <v-textarea
            v-if="shouldShowDeviationField('desviacion')"
            v-model="row.desviacion"
            label="Desviaciones detectadas"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="touch"
          />

          <v-textarea
            v-model="row.accionCorrectiva"
            label="Accion correctiva"
            variant="outlined"
            density="compact"
            rows="2"
            auto-grow
            hide-details
            :disabled="disabled"
            @update:model-value="touch"
          />

          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="row.responsable"
                label="RESPONSABLE"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="touch"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="row.fechaEjecucion"
                label="FECHA DE EJECUCION"
                type="date"
                variant="outlined"
                density="compact"
                hide-details
                :disabled="disabled"
                @update:model-value="touch"
              />
            </v-col>
          </v-row>
        </article>
      </div>

      <div class="deviation-actions">
        <v-btn
          size="small"
          variant="tonal"
          color="success"
          prepend-icon="mdi-plus"
          :disabled="disabled"
          @click="addDeviation"
        >
          Agregar
        </v-btn>
      </div>
    </section>

    <v-textarea
      v-if="config.showGeneralObservation !== false"
      :model-value="getGeneralObservation()"
      :label="config.generalObservationLabel || 'Observaciones generales'"
      variant="outlined"
      density="compact"
      rows="3"
      auto-grow
      hide-details
      :disabled="disabled"
      class="mt-3"
      @update:model-value="setGeneralObservation"
    />

    <section v-if="config.monthlyColorTable" class="monthly-color-section">
      <div class="monthly-color-title">Codificacion de colores para inspeccion mensual</div>
      <div class="monthly-color-table">
        <div class="monthly-color-head">Observacion</div>
        <div class="monthly-color-head">Color</div>
        <div class="monthly-color-head monthly-color-head--months">Meses</div>
        <template v-for="row in config.monthlyColorTable" :key="row.color">
          <div class="monthly-color-cell"></div>
          <div :class="['monthly-color-swatch', `monthly-color-swatch--${row.key}`]">{{ row.color }}</div>
          <div class="monthly-color-months">
            <span v-for="month in row.months" :key="month">{{ month }}</span>
          </div>
        </template>
      </div>
    </section>

    <div v-if="shouldShowReferenceImages('end')" class="reference-grid reference-grid--end">
      <figure v-for="image in config.referenceImages" :key="image.src" class="reference-card">
        <figcaption v-if="image.title" class="reference-title">{{ image.title }}</figcaption>
        <img :src="assetUrl(image.src)" :alt="image.alt || config.title" @error="hideBrokenImage" />
      </figure>
    </div>

    <section v-if="config.considerationNote" class="consideration-note">
      <strong>A considerar:</strong>
      <p>{{ config.considerationNote }}</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, toRef } from 'vue'
import { amsaChecklistConfigs } from './amsaChecklistConfigs'

const props = defineProps({
  attr: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
  checklistId: { type: String, required: true }
})

const emit = defineEmits(['change'])
const attrRef = toRef(props, 'attr')
const renderTick = ref(0)

const config = computed(() => amsaChecklistConfigs[props.checklistId] || { title: 'Checklist AMSA', groups: [] })
const openSections = ref([])

const statesSiNo = [{ value: 'si', label: 'SI' }, { value: 'no', label: 'NO' }]
const statesSiNoNa = [...statesSiNo, { value: 'na', label: 'N/A' }]
const statesBm = [{ value: 'bueno', label: 'BUENO' }, { value: 'malo', label: 'MALO' }]
const statesBmna = [...statesBm, { value: 'na', label: 'N/A' }]
const statesBrm = [{ value: 'bueno', label: 'BUENO' }, { value: 'regular', label: 'REGULAR' }, { value: 'malo', label: 'MALO' }]
const statesFuel = [{ value: 'vacio', label: 'VACIO' }, { value: 'cuarto', label: '1/4' }, { value: 'medio', label: '1/2' }, { value: 'lleno', label: 'LLENO' }]
const statesWeekly = [{ value: 'correcto', label: 'Correcto' }, { value: 'incorrecto', label: 'Incorrecto' }, { value: 'na', label: 'N/A' }]
const weekDays = Array.from({ length: 7 }, (_, index) => ({ value: `dia${index + 1}`, label: `DIA ${index + 1}` }))

onMounted(() => {
  ensureBody()
  openSections.value = config.value.groups.slice(0, 3).map((group) => group.id)
})

function ensureBody() {
  const attr = attrRef.value
  if (!attr.datos || typeof attr.datos !== 'object') attr.datos = {}
  if (!Array.isArray(attr.grupos)) attr.grupos = []
  if (config.value.deviationsTable && (!Array.isArray(attr.desviaciones) || attr.desviaciones.length === 0)) {
    attr.desviaciones = [createDeviationRow()]
  }
  if (config.value.groupDeviationsTable && (!attr.desviacionesPorGrupo || typeof attr.desviacionesPorGrupo !== 'object')) {
    attr.desviacionesPorGrupo = {}
  }
  if (!attr.matrices || typeof attr.matrices !== 'object') attr.matrices = {}
  if (!attr.personasEpp || typeof attr.personasEpp !== 'object') attr.personasEpp = {}
  if (!attr.itemsPorUbicacion || typeof attr.itemsPorUbicacion !== 'object') attr.itemsPorUbicacion = {}
  if (!attr.filasRepetibles || typeof attr.filasRepetibles !== 'object') attr.filasRepetibles = {}

  config.value.groups.forEach((groupDef) => {
    let groupData = attr.grupos.find((candidate) => candidate?.id === groupDef.id)
    if (!groupData) {
      groupData = { id: groupDef.id, title: groupDef.title, stateType: groupDef.stateType, items: [] }
      attr.grupos.push(groupData)
    }
    if (!Array.isArray(groupData.items)) groupData.items = []
    groupDef.items.forEach((itemDef) => {
      if (!groupData.items.some((candidate) => candidate?.id === itemDef.id)) {
        groupData.items.push({ id: itemDef.id, label: itemDef.label, estado: '', estados: {}, extra: {}, observacion: '' })
      }
    })
    if (config.value.groupDeviationsTable && !Array.isArray(attr.desviacionesPorGrupo[groupDef.id])) {
      attr.desviacionesPorGrupo[groupDef.id] = [createDeviationRow()]
    }
    if (groupDef.stateType === 'matrix-sino' && !Array.isArray(attr.matrices[groupDef.id])) {
      attr.matrices[groupDef.id] = [createMatrixRow()]
    }
    if (groupDef.stateType === 'eppu-personas' && !Array.isArray(attr.personasEpp[groupDef.id])) {
      attr.personasEpp[groupDef.id] = [createEppPersonRow(groupDef)]
    } else if (groupDef.stateType === 'eppu-personas') {
      attr.personasEpp[groupDef.id].forEach((person) => {
        if (typeof person.collapsed !== 'boolean') person.collapsed = false
        if (typeof person.observacion !== 'string') person.observacion = ''
      })
    }
    if (groupDef.stateType === 'ubicacion-items' && !Array.isArray(attr.itemsPorUbicacion[groupDef.id])) {
      attr.itemsPorUbicacion[groupDef.id] = [createLocationRow(groupDef)]
    } else if (groupDef.stateType === 'ubicacion-items') {
      attr.itemsPorUbicacion[groupDef.id].forEach((row) => {
        if (typeof row.collapsed !== 'boolean') row.collapsed = false
        if (typeof row.ubicacion !== 'string') row.ubicacion = ''
      })
    }
    if (groupDef.stateType === 'repeat-fields' && !Array.isArray(attr.filasRepetibles[groupDef.id])) {
      attr.filasRepetibles[groupDef.id] = [createRepeatFieldRow(groupDef)]
    } else if (groupDef.stateType === 'repeat-fields') {
      attr.filasRepetibles[groupDef.id].forEach((row) => {
        if (typeof row.collapsed !== 'boolean') row.collapsed = false
        if (!row.values || typeof row.values !== 'object') row.values = {}
      })
    }
  })
}

function touch() {
  renderTick.value += 1
  emit('change')
}

function assetUrl(src) {
  if (!src) return ''
  if (/^(https?:)?\/\//.test(src) || src.startsWith('data:')) return src
  return `${process.env.BASE_URL || '/'}${src}`.replace(/\/{2,}/g, '/')
}

function hideBrokenImage(event) {
  event.target.closest('figure')?.remove()
}

function shouldShowReferenceImages(position) {
  const images = Array.isArray(config.value.referenceImages) ? config.value.referenceImages : []
  if (!images.length) return false
  const configuredPosition = config.value.referenceImagesPosition || 'top'
  return configuredPosition === position
}

function shouldShowDeviationField(field) {
  const fields = config.value.deviationFields
  return !Array.isArray(fields) || fields.includes(field)
}

function getStates(type) {
  if (type === 'bm') return statesBm
  if (type === 'sinona') return statesSiNoNa
  if (type === 'bmnasi') return statesBmna
  if (type === 'fuel') return statesFuel
  if (type === 'licencia') return statesSiNoNa
  return statesSiNo
}

function getColumnStates(item) {
  return Array.isArray(item?.options) && item.options.length ? item.options : statesSiNo
}

function getWeeklyStates(type) {
  return type === 'semanal-sinona' ? statesSiNoNa : statesWeekly
}

function isOpen(id) {
  return openSections.value.includes(id)
}

function toggleSection(id) {
  openSections.value = isOpen(id)
    ? openSections.value.filter((section) => section !== id)
    : [...openSections.value, id]
}

function getDato(key) {
  renderTick.value
  ensureBody()
  return attrRef.value.datos?.[key] ?? ''
}

function setDato(key, value) {
  ensureBody()
  attrRef.value.datos[key] = value ?? ''
  touch()
}

function findGroup(groupId) {
  ensureBody()
  return attrRef.value.grupos.find((group) => group?.id === groupId)
}

function findGroupItem(groupId, itemId) {
  const groupData = findGroup(groupId)
  return groupData?.items?.find((itemData) => itemData?.id === itemId)
}

function getItemValue(groupId, itemId) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.estado ?? ''
}

function setDirectItemValue(groupId, itemId, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  itemData.estado = value ?? ''
  touch()
}

function setItemValue(groupId, itemId, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  itemData.estado = itemData.estado === value ? '' : value
  touch()
}

function getColumnValue(groupId, itemId, column) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.estados?.[column] ?? ''
}

function setColumnValue(groupId, itemId, column, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  if (!itemData.estados || typeof itemData.estados !== 'object') itemData.estados = {}
  itemData.estados[column] = itemData.estados[column] === value ? '' : value
  touch()
}

function getExtraValue(groupId, itemId, key) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.extra?.[key] ?? ''
}

function setExtraValue(groupId, itemId, key, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  if (!itemData.extra || typeof itemData.extra !== 'object') itemData.extra = {}
  itemData.extra[key] = itemData.extra[key] === value ? '' : value
  touch()
}

function setExtraTextValue(groupId, itemId, key, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  if (!itemData.extra || typeof itemData.extra !== 'object') itemData.extra = {}
  itemData.extra[key] = value ?? ''
  touch()
}

function getItemObservation(groupId, itemId) {
  renderTick.value
  return findGroupItem(groupId, itemId)?.observacion ?? ''
}

function setItemObservation(groupId, itemId, value) {
  const itemData = findGroupItem(groupId, itemId)
  if (!itemData) return
  itemData.observacion = value ?? ''
  touch()
}

function getGroupAnswered(groupId) {
  renderTick.value
  const groupDef = config.value.groups.find((group) => group.id === groupId)
  if (groupDef?.stateType === 'matrix-sino') {
    return getMatrixRows(groupId).filter((row) => hasMatrixData(row)).length
  }
  if (groupDef?.stateType === 'eppu-personas') {
    return getEppPersonRows(groupId).filter((row) => hasEppPersonData(row)).length
  }
  if (groupDef?.stateType === 'ubicacion-items') {
    return getLocationRows(groupId).filter((row) => hasLocationRowData(row)).length
  }
  if (groupDef?.stateType === 'repeat-fields') {
    return getRepeatFieldRows(groupId).filter((row) => hasRepeatFieldRowData(row)).length
  }
  const groupData = findGroup(groupId)
  return (groupData?.items || []).filter((itemData) => hasItemData(itemData)).length
}

function getGroupTotal(group) {
  if (group.stateType === 'matrix-sino') return getMatrixRows(group.id).length
  if (group.stateType === 'eppu-personas') return getEppPersonRows(group.id).length
  if (group.stateType === 'ubicacion-items') return getLocationRows(group.id).length
  if (group.stateType === 'repeat-fields') return getRepeatFieldRows(group.id).length
  return group.items.length
}

function hasItemData(itemData) {
  return String(itemData?.estado ?? '').trim() !== '' ||
    String(itemData?.observacion ?? '').trim() !== '' ||
    Object.values(itemData?.estados || {}).some((value) => String(value ?? '').trim() !== '') ||
    Object.values(itemData?.extra || {}).some((value) => String(value ?? '').trim() !== '')
}

function hasMatrixData(row) {
  return String(row?.codigo ?? '').trim() !== '' ||
    Object.values(row?.estados || {}).some((value) => String(value ?? '').trim() !== '')
}

function hasEppPersonData(row) {
  return String(row?.nombreApellido ?? '').trim() !== '' ||
    String(row?.observacion ?? '').trim() !== '' ||
    Object.values(row?.items || {}).some((item) => {
      return String(item?.estado ?? '').trim() !== '' ||
        Object.values(item?.extra || {}).some((value) => String(value ?? '').trim() !== '')
    })
}

function hasLocationRowData(row) {
  return String(row?.ubicacion ?? '').trim() !== '' ||
    Object.values(row?.items || {}).some((item) => String(item?.estado ?? '').trim() !== '')
}

function hasRepeatFieldRowData(row) {
  return Object.values(row?.values || {}).some((value) => String(value ?? '').trim() !== '')
}

function getGeneralObservation() {
  renderTick.value
  ensureBody()
  return attrRef.value.observacionesGenerales ?? ''
}

function setGeneralObservation(value) {
  attrRef.value.observacionesGenerales = value ?? ''
  touch()
}

function createDeviationRow() {
  return {
    id: `dev-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    desviacion: '',
    accionCorrectiva: '',
    responsable: '',
    fechaEjecucion: ''
  }
}

function createMatrixRow() {
  return {
    id: `matrix-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    codigo: '',
    estados: {}
  }
}

function createEppPersonRow(groupDef) {
  return {
    id: `epp-person-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    nombreApellido: '',
    observacion: '',
    collapsed: false,
    items: Object.fromEntries((groupDef?.items || []).map((item) => [item.id, { estado: '', extra: {} }]))
  }
}

function createLocationRow(groupDef) {
  return {
    id: `location-row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ubicacion: '',
    collapsed: false,
    items: Object.fromEntries((groupDef?.items || []).map((item) => [item.id, { estado: '' }]))
  }
}

function createRepeatFieldRow(groupDef) {
  return {
    id: `repeat-row-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    collapsed: false,
    values: Object.fromEntries((groupDef?.fields || []).map((field) => [field.key, '']))
  }
}

function getDeviations() {
  renderTick.value
  ensureBody()
  return attrRef.value.desviaciones
}

function addDeviation() {
  ensureBody()
  attrRef.value.desviaciones.push(createDeviationRow())
  touch()
}

function removeDeviation(index) {
  ensureBody()
  attrRef.value.desviaciones.splice(index, 1)
  if (attrRef.value.desviaciones.length === 0) {
    attrRef.value.desviaciones.push(createDeviationRow())
  }
  touch()
}

function getGroupDeviations(groupId) {
  renderTick.value
  ensureBody()
  return attrRef.value.desviacionesPorGrupo[groupId]
}

function addGroupDeviation(groupId) {
  ensureBody()
  attrRef.value.desviacionesPorGrupo[groupId].push(createDeviationRow())
  touch()
}

function removeGroupDeviation(groupId, index) {
  ensureBody()
  attrRef.value.desviacionesPorGrupo[groupId].splice(index, 1)
  if (attrRef.value.desviacionesPorGrupo[groupId].length === 0) {
    attrRef.value.desviacionesPorGrupo[groupId].push(createDeviationRow())
  }
  touch()
}

function getMatrixRows(groupId) {
  renderTick.value
  ensureBody()
  return attrRef.value.matrices[groupId]
}

function addMatrixRow(groupId) {
  ensureBody()
  attrRef.value.matrices[groupId].push(createMatrixRow())
  touch()
}

function removeMatrixRow(groupId, index) {
  ensureBody()
  attrRef.value.matrices[groupId].splice(index, 1)
  if (attrRef.value.matrices[groupId].length === 0) {
    attrRef.value.matrices[groupId].push(createMatrixRow())
  }
  touch()
}

function getEppPersonRows(groupId) {
  renderTick.value
  ensureBody()
  return attrRef.value.personasEpp[groupId]
}

function getEppGroupDef(groupId) {
  return config.value.groups.find((group) => group.id === groupId)
}

function addEppPersonRow(groupId) {
  ensureBody()
  attrRef.value.personasEpp[groupId].push(createEppPersonRow(getEppGroupDef(groupId)))
  touch()
}

function removeEppPersonRow(groupId, index) {
  ensureBody()
  attrRef.value.personasEpp[groupId].splice(index, 1)
  if (attrRef.value.personasEpp[groupId].length === 0) {
    attrRef.value.personasEpp[groupId].push(createEppPersonRow(getEppGroupDef(groupId)))
  }
  touch()
}

function getEppPersonTitle(person, index) {
  const name = String(person?.nombreApellido ?? '').trim()
  return name ? `Persona ${index + 1} - ${name}` : `Persona ${index + 1}`
}

function toggleEppPersonCollapsed(groupId, personId) {
  const person = getEppPersonRows(groupId).find((candidate) => candidate.id === personId)
  if (!person) return
  person.collapsed = !person.collapsed
  touch()
}

function getEppPersonItem(groupId, personId, itemId) {
  const person = getEppPersonRows(groupId).find((candidate) => candidate.id === personId)
  if (!person) return null
  if (!person.items || typeof person.items !== 'object') person.items = {}
  if (!person.items[itemId]) person.items[itemId] = { estado: '', extra: {} }
  if (!person.items[itemId].extra || typeof person.items[itemId].extra !== 'object') person.items[itemId].extra = {}
  return person.items[itemId]
}

function getEppPersonValue(groupId, personId, itemId) {
  renderTick.value
  return getEppPersonItem(groupId, personId, itemId)?.estado ?? ''
}

function setEppPersonValue(groupId, personId, itemId, value) {
  const item = getEppPersonItem(groupId, personId, itemId)
  if (!item) return
  item.estado = item.estado === value ? '' : value
  touch()
}

function getEppPersonExtra(groupId, personId, itemId, key) {
  renderTick.value
  return getEppPersonItem(groupId, personId, itemId)?.extra?.[key] ?? ''
}

function setEppPersonExtra(groupId, personId, itemId, key, value) {
  const item = getEppPersonItem(groupId, personId, itemId)
  if (!item) return
  item.extra[key] = item.extra[key] === value ? '' : value
  touch()
}

function getLocationRows(groupId) {
  renderTick.value
  ensureBody()
  return attrRef.value.itemsPorUbicacion[groupId]
}

function getLocationGroupDef(groupId) {
  return config.value.groups.find((group) => group.id === groupId)
}

function addLocationRow(groupId) {
  ensureBody()
  attrRef.value.itemsPorUbicacion[groupId].push(createLocationRow(getLocationGroupDef(groupId)))
  touch()
}

function removeLocationRow(groupId, index) {
  ensureBody()
  attrRef.value.itemsPorUbicacion[groupId].splice(index, 1)
  if (attrRef.value.itemsPorUbicacion[groupId].length === 0) {
    attrRef.value.itemsPorUbicacion[groupId].push(createLocationRow(getLocationGroupDef(groupId)))
  }
  touch()
}

function getLocationRowTitle(row, index) {
  const location = String(row?.ubicacion ?? '').trim()
  return location ? `N° ${index + 1} - ${location}` : `N° ${index + 1}`
}

function toggleLocationRowCollapsed(groupId, rowId) {
  const row = getLocationRows(groupId).find((candidate) => candidate.id === rowId)
  if (!row) return
  row.collapsed = !row.collapsed
  touch()
}

function getLocationItem(groupId, rowId, itemId) {
  const row = getLocationRows(groupId).find((candidate) => candidate.id === rowId)
  if (!row) return null
  if (!row.items || typeof row.items !== 'object') row.items = {}
  if (!row.items[itemId]) row.items[itemId] = { estado: '' }
  return row.items[itemId]
}

function getLocationItemValue(groupId, rowId, itemId) {
  renderTick.value
  return getLocationItem(groupId, rowId, itemId)?.estado ?? ''
}

function setLocationItemValue(groupId, rowId, itemId, value) {
  const item = getLocationItem(groupId, rowId, itemId)
  if (!item) return
  item.estado = item.estado === value ? '' : value
  touch()
}

function getRepeatFieldRows(groupId) {
  renderTick.value
  ensureBody()
  return attrRef.value.filasRepetibles[groupId]
}

function getRepeatFieldGroupDef(groupId) {
  return config.value.groups.find((group) => group.id === groupId)
}

function addRepeatFieldRow(groupId) {
  ensureBody()
  attrRef.value.filasRepetibles[groupId].push(createRepeatFieldRow(getRepeatFieldGroupDef(groupId)))
  touch()
}

function removeRepeatFieldRow(groupId, index) {
  ensureBody()
  attrRef.value.filasRepetibles[groupId].splice(index, 1)
  if (attrRef.value.filasRepetibles[groupId].length === 0) {
    attrRef.value.filasRepetibles[groupId].push(createRepeatFieldRow(getRepeatFieldGroupDef(groupId)))
  }
  touch()
}

function getRepeatFieldRowTitle(group, row, index) {
  const labelKey = group.titleField || 'nombreApellidos'
  const label = String(row?.values?.[labelKey] ?? '').trim()
  return label ? `N° ${index + 1} - ${label}` : `N° ${index + 1}`
}

function toggleRepeatFieldRowCollapsed(groupId, rowId) {
  const row = getRepeatFieldRows(groupId).find((candidate) => candidate.id === rowId)
  if (!row) return
  row.collapsed = !row.collapsed
  touch()
}

function setRepeatFieldValue(groupId, rowId, key, value, toggle = false) {
  const row = getRepeatFieldRows(groupId).find((candidate) => candidate.id === rowId)
  if (!row) return
  if (!row.values || typeof row.values !== 'object') row.values = {}
  row.values[key] = toggle && row.values[key] === value ? '' : (value ?? '')
  touch()
}

function setMatrixValue(groupId, rowId, criterionId, value) {
  const row = getMatrixRows(groupId).find((candidate) => candidate.id === rowId)
  if (!row) return
  if (!row.estados || typeof row.estados !== 'object') row.estados = {}
  row.estados[criterionId] = row.estados[criterionId] === value ? '' : value
  touch()
}
</script>

<style scoped>
.checklist-amsa-base {
  color: #e5e7eb;
}

.section-block {
  border: 1px solid rgba(34, 211, 238, 0.38);
  border-radius: 8px;
  margin-bottom: 10px;
  overflow: hidden;
  background: rgba(15, 23, 42, 0.72);
}

.section-title {
  align-items: center;
  background: #1f2937;
  border: 0;
  color: #f8fafc;
  cursor: pointer;
  display: flex;
  font-weight: 800;
  justify-content: space-between;
  letter-spacing: 0;
  min-height: 44px;
  padding: 10px 14px;
  text-align: left;
  text-transform: uppercase;
  width: 100%;
}

.section-actions {
  align-items: center;
  display: inline-flex;
  gap: 8px;
  margin-left: 10px;
}

.answered-count {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.55);
  border-radius: 999px;
  color: #a7f3d0;
  font-size: 0.75rem;
  font-weight: 900;
  padding: 2px 8px;
  white-space: nowrap;
}

.section-body {
  display: grid;
  gap: 10px;
  padding: 10px;
}

.item-card {
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 10px;
}

.reference-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
  margin-bottom: 10px;
}

.reference-grid--end {
  margin-bottom: 0;
  margin-top: 10px;
}

.section-reference-card {
  margin-bottom: 0;
}

.reference-card {
  background: #f8fafc;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  margin: 0;
  overflow: hidden;
  padding: 8px;
}

.reference-card img {
  display: block;
  height: auto;
  max-height: 520px;
  object-fit: contain;
  width: 100%;
}

.reference-title {
  color: #0f172a;
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0;
  margin-bottom: 8px;
  text-align: center;
  text-transform: uppercase;
}

.consideration-note {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  color: #f8fafc;
  display: grid;
  gap: 8px;
  margin-top: 10px;
  padding: 10px;
}

.consideration-note strong {
  font-size: 0.84rem;
  text-transform: uppercase;
}

.consideration-note p {
  margin: 0;
}

.deviations-section {
  margin-top: 10px;
}

.deviation-cards {
  display: grid;
  gap: 10px;
}

.matrix-section,
.matrix-criteria {
  display: grid;
  gap: 10px;
}

.matrix-row-card {
  margin: 0;
}

.matrix-criterion {
  border: 1px solid rgba(34, 211, 238, 0.34);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 8px;
}

.monthly-color-section {
  margin-top: 10px;
}

.monthly-color-title {
  background: #1f2937;
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px 8px 0 0;
  color: #f8fafc;
  font-weight: 900;
  padding: 10px;
  text-align: center;
  text-transform: uppercase;
}

.monthly-color-table {
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-top: 0;
  display: grid;
  grid-template-columns: 1fr 120px 1.6fr;
  overflow: hidden;
}

.monthly-color-head,
.monthly-color-cell,
.monthly-color-swatch,
.monthly-color-months {
  align-items: center;
  border-top: 1px solid rgba(34, 211, 238, 0.28);
  color: #f8fafc;
  display: flex;
  min-height: 32px;
  padding: 6px 8px;
}

.monthly-color-head {
  background: rgba(15, 23, 42, 0.92);
  font-weight: 900;
  justify-content: center;
  text-transform: uppercase;
}

.monthly-color-swatch {
  color: #020617;
  font-weight: 900;
  justify-content: center;
  text-transform: uppercase;
}

.monthly-color-swatch--amarillo {
  background: #facc15;
}

.monthly-color-swatch--rojo {
  background: #ef4444;
  color: #fff;
}

.monthly-color-swatch--azul {
  background: #0ea5e9;
  color: #fff;
}

.monthly-color-swatch--verde {
  background: #22c55e;
}

.monthly-color-months {
  display: grid;
  gap: 4px;
  grid-template-columns: repeat(3, 1fr);
  text-align: center;
}

.deviation-card {
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid rgba(34, 211, 238, 0.45);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 10px;
}

.person-section,
.epp-person-card,
.epp-person-items,
.epp-person-item {
  display: grid;
  gap: 10px;
}

.epp-person-card {
  gap: 14px;
}

.epp-person-item {
  border: 1px solid rgba(34, 211, 238, 0.28);
  border-radius: 8px;
  padding: 10px;
}

.repeat-field-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.repeat-field-toggle {
  display: grid;
  gap: 6px;
}

.repeat-field-toggle span {
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.deviation-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.deviation-head {
  align-items: center;
  color: #f8fafc;
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.deviation-number {
  color: #f8fafc;
  font-size: 12px;
  font-weight: 900;
}

.person-card-actions {
  display: inline-flex;
  gap: 6px;
}

.collapse-btn {
  background: rgba(14, 165, 233, 0.22) !important;
  border: 1px solid rgba(125, 211, 252, 0.65);
  color: #bae6fd !important;
}

.delete-btn {
  background: rgba(220, 38, 38, 0.28) !important;
  border: 1px solid rgba(248, 113, 113, 0.7);
  color: #fecaca !important;
}

.delete-btn :deep(.v-icon) {
  color: #fecaca !important;
  opacity: 1;
}

.state-row,
.split-state,
.column-grid {
  display: grid;
  gap: 6px;
}

.state-row--two {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.state-row--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.split-state {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.column-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.column-check {
  display: grid;
  gap: 4px;
}

.column-check span,
.split-state span {
  color: #cbd5e1;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.state-toggle {
  background: #1f2937;
  border: 1px solid #475569;
  border-radius: 7px;
  color: #f8fafc;
  font-size: 0.78rem;
  font-weight: 900;
  min-height: 34px;
  padding: 7px 6px;
}

.state-toggle:disabled {
  cursor: default;
  opacity: 0.7;
}

.state-toggle--bueno,
.state-toggle--si,
.state-toggle--correcto,
.state-toggle--lleno {
  background: #064e3b;
  border-color: #10b981;
}

.state-toggle--regular,
.state-toggle--cuarto,
.state-toggle--medio {
  background: #78350f;
  border-color: #f59e0b;
}

.state-toggle--malo,
.state-toggle--no,
.state-toggle--incorrecto,
.state-toggle--vacio {
  background: #7f1d1d;
  border-color: #ef4444;
}

.state-toggle--na {
  background: #374151;
  border-color: #94a3b8;
}

.double-header {
  background: #0f766e;
  border: 1px solid rgba(45, 212, 191, 0.7);
  border-radius: 8px;
  color: #ecfeff;
  font-weight: 900;
  margin: 0 0 10px;
  padding: 10px 14px;
  text-transform: uppercase;
}

@media (max-width: 700px) {
  .split-state,
  .column-grid,
  .repeat-field-grid {
    grid-template-columns: 1fr;
  }

  .state-toggle {
    font-size: 0.68rem;
    min-height: 32px;
    padding: 6px 4px;
  }
}
</style>
