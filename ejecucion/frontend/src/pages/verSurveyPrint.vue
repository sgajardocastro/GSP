<template>
  <div class="print-page">
    <!-- ✅ CABECERA FIJA ARRIBA -->
    <div class="fixed-header">
      <div class="logo">
        <img
          v-if="imagenEmpresaTransmac"
          :src="getLogoUrl(imagenEmpresaTransmac)"
          alt="Logo Transmac"
        >
      </div>
      <div class="report-title">
        <h1>{{ surveyDetailStore.surveyDetail[0]?.desc_template_srv ?? '' }}</h1>
      </div>
      <div class="logo">
        <img
          v-if="imagenEmpresa"
          :src="getLogoUrl(imagenEmpresa)"
          alt="Logo Empresa"
        >
      </div>
    </div>

    <!-- ✅ CONTENIDO -->
    <div class="content">
      <!-- INFO GENERAL: dos tablas lado a lado -->
      <!-- TÍTULO ÚNICO -->
      <h2 class="info-title">
        Datos Generales del Protocolo
      </h2>

      <!-- DOS TABLAS LADO A LADO -->
      <div class="info-row">
        <div class="info-block">
          <table class="info-table">
            <tr>
              <td><strong>Área:</strong></td>
              <td>{{ surveyDetailStore.surveyDetail[0]?.name_area ?? '' }}</td>
            </tr>
            <tr>
              <td><strong>Familia:</strong></td>
              <td>
                {{ surveyDetailStore.surveyDetail[0]?.name_tipo_srv ?? '' }}
                ({{ surveyDetailStore.surveyDetail[0]?.codi_tipo_srv ?? '' }})
              </td>
            </tr>
            <tr>
              <td><strong>Código Documento:</strong></td>
              <td>{{ surveyDetailStore.surveyDetail[0]?.codi_template_srv ?? '' }}</td>
            </tr>
            <tr>
              <td><strong>Nombre:</strong></td>
              <td>{{ surveyDetailStore.surveyDetail[0]?.name_template_srv ?? '' }}</td>
            </tr>
            <tr>
              <td><strong>Id Documento:</strong></td>
              <td>{{ surveyDetailStore.surveyDetail[0]?.id_survey ?? '' }}</td>
            </tr>
          </table>
        </div>

        <div class="info-block">
          <table class="info-table">
            <tr>
              <td><strong>Empresa / Proyecto:</strong></td>
              <td>
                {{ surveyDetailStore.surveyDetail[0]?.name_empresa_cliente ?? '' }} /
                {{ surveyDetailStore.surveyDetail[0]?.nombre_proyecto ?? '' }}
              </td>
            </tr>
            <tr>
              <td><strong>Fechas Plan:</strong></td>
              <td>
                {{ formatDate(surveyDetailStore.surveyDetail[0]?.fecha_plan_ini) }} -
                {{ formatDate(surveyDetailStore.surveyDetail[0]?.fecha_plan_fin) }}
              </td>
            </tr>
            <tr>
              <td><strong>Fechas Real:</strong></td>
              <td>
                {{ formatDate(surveyDetailStore.surveyDetail[0]?.fecha_real_ini) }} -
                {{ formatDate(surveyDetailStore.surveyDetail[0]?.fecha_ejec_fin) }}
              </td>
            </tr>
            <tr>
              <td><strong>Usuario:</strong></td>
              <td>
                {{
                  (user.name_frst ?? '') + ' ' +
                    (user.apellido_pat ?? '') + ' ' +
                    (user.apellido_mat ?? '')
                }}
              </td>
            </tr>
          </table>
        </div>
      </div>

      <!-- MAPA GENERAL DE UBICACION DE LA ENCUESTA (SOLO COORDENADAS GPS SINO TIENE MAPA DESHABILITADO) -->
      <div 
        v-if="hasCabeceraGPS"
        class="gps-cabecera-box"
        style="margin-top: 16px; margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; background-color: #f8fafc; page-break-inside: avoid;"
      >
        <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 13px; color: #0f172a; font-weight: 700;">
          Ubicación de Registro de la Encuesta
        </h3>
        <div style="font-size: 11px; margin-bottom: 0px; color: #475569;">
          <strong>Coordenadas GPS:</strong> Latitud: {{ getCabeceraLat() }} | Longitud: {{ getCabeceraLng() }}
        </div>
      </div>

      <!-- ESTRUCTURADOR DE SERVICIOS (LÍNEAS DE SERVICIO COTIZADAS) -->
      <div v-if="lineasServicio.length > 0" class="estructurador-print-box" style="margin-top: 20px; margin-bottom: 24px; page-break-inside: avoid;">
        <h2 class="segment-title" style="margin-bottom: 10px;">
          Estructurador de Servicios (Desglose Comercial)
        </h2>
        <table class="data-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 8px 10px; font-size: 11px; text-align: left;">Categoría</th>
              <th style="padding: 8px 10px; font-size: 11px; text-align: left;">Subcategoría</th>
              <th style="padding: 8px 10px; font-size: 11px; text-align: left;">Descripción / Equipo</th>
              <th style="padding: 8px 10px; font-size: 11px; text-align: center; width: 60px;">Cant.</th>
              <th style="padding: 8px 10px; font-size: 11px; text-align: center; width: 100px;">Unidad</th>
              <th style="padding: 8px 10px; font-size: 11px; text-align: right; width: 110px;">Valor Unit.</th>
              <th style="padding: 8px 10px; font-size: 11px; text-align: right; width: 120px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(line, lIdx) in lineasServicio" :key="'line-print-' + lIdx" style="border-bottom: 1px solid #e2e8f0;">
              <td class="value-cell" style="font-weight: 700; color: #1e293b;">{{ line.tipo || line.categoria || '—' }}</td>
              <td class="value-cell">{{ line.subcategoria || '—' }}</td>
              <td class="value-cell">{{ line.descripcion || '—' }}</td>
              <td class="value-cell" style="text-align: center;">{{ line.cantidad || 1 }}</td>
              <td class="value-cell" style="text-align: center;">{{ line.unidad || 'Fijo' }}</td>
              <td class="value-cell" style="text-align: right;">${{ Number(line.valorUnitario || line.valor_unitario || 0).toLocaleString('es-CL') }}</td>
              <td class="value-cell" style="text-align: right; font-weight: 700; color: #0f172a;">${{ (Number(line.cantidad || 1) * Number(line.valorUnitario || line.valor_unitario || 0)).toLocaleString('es-CL') }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a;">
              <td colspan="6" style="padding: 10px; text-align: right; font-size: 12px; color: #0f172a; text-transform: uppercase;">Monto Total Cotizado (Neto):</td>
              <td style="padding: 10px; text-align: right; font-size: 13px; color: #d97706;">${{ totalServicios.toLocaleString('es-CL') }}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- ================== PPD: Parte Producción Diaria ================== -->
      <template v-if="isPPD">
        <h2 class="segment-title">
          Partidas
        </h2>

        <div
          v-for="(grupo, gIdx) in cuadrillasPPD"
          :key="'ppd-cuadrilla-' + gIdx"
          class="ppd-cuadrilla"
        >
          <!-- Header Cuadrilla -->
          <div class="ppd-cuadrilla-header">
            <span class="ppd-cuadrilla-title">
              {{ grupo.cuadrilla }}
            </span>
            <span class="ppd-chip">
              {{ grupo.partidas }} partidas
            </span>
            <span class="ppd-chip">
              {{ grupo.totalHoras }} hrs
            </span>
          </div>

          <!-- Partidas de la cuadrilla (todas desplegadas) -->
          <div
            v-for="(tarea, tIdx) in grupo.tareas"
            :key="'ppd-tarea-' + tIdx"
            class="ppd-partida-block"
          >
            <h3 class="ppd-partida-title">
              {{ tarea.partida }}
            </h3>

            <table class="data-table">
              <tbody>
                <tr>
                  <td
                    class="label-cell"
                    style="width: 25%;"
                  >
                    Planificado
                  </td>
                  <td
                    class="value-cell"
                    style="width: 25%;"
                  >
                    {{ tarea.plan ?? '—' }} {{ tarea.unidad || '' }}
                  </td>
                  <td
                    class="label-cell"
                    style="width: 25%;"
                  >
                    Avance Real
                  </td>
                  <td
                    class="value-cell"
                    style="width: 25%;"
                  >
                    {{ tarea.real ?? '—' }} {{ tarea.unidad || '' }}
                  </td>
                </tr>

                <tr>
                  <td class="label-cell">
                    Motivo de No Cumplimiento
                  </td>
                  <td
                    class="value-cell"
                    colspan="3"
                  >
                    {{ tarea.motivo || '—' }}
                  </td>
                </tr>

                <tr>
                  <td class="label-cell">
                    Observaciones
                  </td>
                  <td
                    class="value-cell"
                    colspan="3"
                  >
                    {{ tarea.observaciones || '—' }}
                  </td>
                </tr>

                <tr v-if="(tarea.fotos || []).length">
                  <td class="label-cell">
                    Fotos
                  </td>
                  <td
                    class="value-cell"
                    colspan="3"
                  >
                    <div class="photo-container">
                      <img
                        v-for="(foto, fIdx) in tarea.fotos"
                        :key="'foto-' + fIdx"
                        :src="foto.url || foto.base64 || foto.src"
                        class="photo-img"
                        style="width: 120px; height: 90px; object-fit: cover;"
                      >
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Horas asignadas -->
            <h4 class="ppd-subtitle">
              Horas Asignadas
            </h4>
            <table class="data-table">
              <thead>
                <tr>
                  <th class="label-cell">
                    Persona
                  </th>
                  <th
                    class="label-cell"
                    style="width: 20%;"
                  >
                    Horas
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(p, pIdx) in tarea.assigned_personnel || []"
                  :key="'pers-' + pIdx"
                >
                  <td class="value-cell">
                    {{ p.nombre }}
                  </td>
                  <td
                    class="value-cell"
                    style="text-align: center;"
                  >
                    {{ p.horas ?? '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
      <!-- ================== RESTO DE SURVEYS (no PPD) ================== -->
      <template v-else>
        <!-- SEGMENTOS (igual que antes) -->
        <div
          v-for="survey in surveyDetailStore.surveyDetail"
          :key="survey.id_survey"
        >
          <div
            v-for="(segmento, index) in getSegmentos(survey)"
            :key="segmento.posicion ?? index"
          >
            <h2 class="segment-title">
              {{ segmento.label ?? `Segmento ${index + 1}` }}
            </h2>

            <table
              v-if="segmento.attributes?.length"
              :class="['data-table', { 'data-table-verdoc': hasVerDoc(segmento) }]"
            >
              <tbody>
                <!-- Agrupación en pares -->
                <tr
                  v-for="(fila, filaIndex) in agruparPorTipoPares(
                    getInlineAttrsForPrint(segmento)
                  )"
                  :key="'fila-' + filaIndex"
                >
                  <!-- Caso: 1 atributo → agrega 2 columnas vacías -->
                  <template v-if="fila.length === 1">
                    <td
                      class="label-cell"
                      style="width: 25%;"
                    >
                      {{ getInlineAttrLabel(fila[0]) }}
                    </td>
                    <td
                      class="value-cell"
                      style="width: 25%;"
                    >
                      <template v-if="isImageDoc(displayAttrValue(fila[0]) || fila[0])">
                        <img
                          :src="resolveImgSrc(displayAttrValue(fila[0]) || fila[0])"
                          alt="Firma / Imagen"
                          style="max-height: 120px; max-width: 100%; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #ffffff; display: block; margin: 4px 0;"
                        >
                      </template>
                      <template v-else>
                        {{ displayAttrValue(fila[0]) }}
                      </template>
                    </td>
                    <td
                      class="label-cell"
                      style="width: 25%;"
                    >
&nbsp;
                    </td>
                    <td
                      class="value-cell"
                      style="width: 25%;"
                    >
&nbsp;
                    </td>
                  </template>

                  <!-- Caso: 2 atributos -->
                  <template v-else>
                    <template
                      v-for="(attr, i) in fila"
                      :key="'attr-' + i"
                    >
                      <td
                        class="label-cell"
                        style="width: 25%;"
                      >
                        {{ getInlineAttrLabel(attr) }}
                      </td>
                      <td
                        class="value-cell"
                        style="width: 25%;"
                      >
                        <template v-if="isImageDoc(displayAttrValue(attr) || attr)">
                          <img
                            :src="resolveImgSrc(displayAttrValue(attr) || attr)"
                            alt="Firma / Imagen"
                            style="max-height: 120px; max-width: 100%; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #ffffff; display: block; margin: 4px 0;"
                          >
                        </template>
                        <template v-else>
                          {{ displayAttrValue(attr) }}
                        </template>
                      </td>
                    </template>
                  </template>
                </tr>

                <tr
                  v-for="(attr, i) in segmento.attributes.filter(attr => attr.type === 'fileUpload')"
                  :key="'fu-' + i"
                >
                  <td
                    class="label-cell"
                    style="width: 25%;"
                  >
                    Documento
                  </td>

                  <td
                    class="value-cell"
                    style="width: 25%;"
                  >
                    <ul
                      class="pa-0 ma-0"
                      style="list-style: none;"
                    >
                      <li
                        v-for="(file, idx) in (attr.archivos || [])"
                        :key="idx"
                        class="mb-2"
                      >
                        <!-- ✅ Visualización directa de Firma / Imagen si es archivo de imagen -->
                        <div v-if="isImageDoc(file || attr)" class="my-2">
                          <img
                            :src="resolveImgSrc(file.name_doc_interno || file.url || file.name || file)"
                            alt="Firma / Imagen"
                            style="max-height: 120px; max-width: 100%; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; padding: 4px; background: #ffffff; display: block;"
                          >
                        </div>
                        <a
                          :href="resolveImgSrc(file.name_doc_interno || file.url || file.name || file)"
                          :download="file.nombre || file.name"
                          target="_blank"
                          rel="noopener"
                          style="font-size: 11px; font-weight: bold; color: #0284c7;"
                        >
                          📄 {{ file.name_doc_orig || file.name || 'Ver Archivo' }}
                        </a>

                        <!-- ✅ NUEVO: Fecha + horas -->
                        <div class="text-caption text-grey">
                          <div v-if="file.device_uploaded_at">
                            Fecha, Hora Registro: {{ formatCL(file.device_uploaded_at) }}
                          </div>

                          <div v-if="file.server_uploaded_at">
                            Fecha, Hora Servidor: {{ formatCL(file.server_uploaded_at) }}
                          </div>
                        </div>
                      </li>
                    </ul>
                  </td>

                  <td
                    class="value-cell"
                    style="width: 50%;"
                  >
                    {{ attr.obs }}
                  </td>
                </tr>

                <!-- Filas de los comboBox, uno por atritubo comboBox -->
                <!-- Encabezado SOLO si hay al menos un comboBox -->
                <!-- Header: solo si existe al menos un comboBox -->
                <!--tr v-if="(segmento.attributes || []).some(a => a.type === 'comboBox')">
                  <td
                    v-for="(h, i) in comboHeaderCells(segmento)"
                    :key="'combo-hdr-'+i"
                    class="label-cell-header"
                    :colspan="h.span"
                  >
                    {{ h.text }}
                  </td>
                </tr-->

                <!-- Filas por pares -->
                <!-- Filas por pares de comboBox -->
                <tr
                  v-for="(pair, pairIndex) in agruparPorTipoPares(
                    getStandaloneComboAttrs(segmento)
                  )"
                  :key="'combo-pair-' + pairIndex"
                >
                  <!-- Caso impar: solo un atributo → deja dos columnas en blanco -->
                  <template v-if="pair.length === 1">
                    <td
                      class="label-cell"
                      style="width: 25%;"
                    >
                      {{ pair[0].values?.quest }}
                    </td>
                    <td
                      class="value-cell"
                      style="width: 25%;"
                    >
                      {{ displayComboValue(pair[0]) }}
                    </td>
                    <td
                      class="label-cell"
                      style="width: 25%;"
                    >
&nbsp;
                    </td>
                    <td
                      class="value-cell"
                      style="width: 25%;"
                    >
&nbsp;
                    </td>
                  </template>

                  <!-- Caso par: dos atributos (cada uno ocupa 2 celdas) -->
                  <template v-else>
                    <template
                      v-for="(attr, i) in pair"
                      :key="'combo-' + pairIndex + '-' + i"
                    >
                      <td
                        class="label-cell"
                        style="width: 25%;"
                      >
                        {{ attr.values?.quest }}
                      </td>
                      <td
                        class="value-cell"
                        style="width: 25%;"
                      >
                        {{ displayComboValue(attr) }}
                      </td>
                    </template>
                  </template>
                </tr>

                <!-- photo -->
                <tr>
                  <td colspan="4">
                    <table style="width: 100%; border-collapse: collapse;">
                      <tr
                        v-for="(attr, index) in segmento.attributes.filter(attr => attr.type === 'photo')"
                        :key="'photo-' + index"
                      >
                        <td style="width: 100%; text-align: center; vertical-align: top; padding: 8px;">
                          <!-- Título -->
                          <div
                            class="label-cell"
                            style="font-weight: bold; text-align: center; width: 100%; display: block; margin-bottom: 6px;"
                          >
                            {{ attr.label }}
                          </div>

                          <!-- Imagen -->
                          <div
                            class="value-cell photo-cell"
                            style="width: 100%;"
                          >
                            <img
                              :src="attr.src"
                              class="photo-img"
                              style="width: 100%; max-height: 300px; object-fit: contain; display: block; margin: auto;"
                              :alt="'Foto de ' + attr.label"
                            >
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>


                <!-- photoCheck -->
                <!-- Encabezado SOLO si hay al menos un photoCheck -->
                <tr v-if="(segmento.attributes || []).some(a => a.type === 'photoCheck')">
                  <td class="label-cell-header">
                    {{
                      segmento.attributes.find(a => a.type === 'photoCheck')?.titulos?.titulo1
                        ?? 'Identificador'
                    }}
                  </td>
                  <td class="label-cell-header">
                    {{
                      segmento.attributes.find(a => a.type === 'photoCheck')?.titulos?.titulo2
                        ?? 'Imagen'
                    }}
                  </td>
                  <td
                    class="label-cell-header"
                    style="width:10%;"
                  >
                    {{
                      segmento.attributes.find(a => a.type === 'photoCheck')?.titulos?.titulo3
                        ?? 'Valor'
                    }}
                  </td>
                  <td class="label-cell-header">
                    {{
                      segmento.attributes.find(a => a.type === 'photoCheck')?.titulos?.titulo4
                        ?? 'Observación'
                    }}
                  </td>
                </tr>

                <!-- Filas -->
                <tr
                  v-for="(attr, index) in segmento.attributes.filter(attr => attr.type === 'photoCheck')"
                  :key="'photoCheck-' + index"
                >
                  <!-- 1) Label -->
                  <td
                    class="label-cell"
                    style="width:25%;"
                  >
                    {{ attr.label }}
                  </td>

                  <!-- 2) Imagen -->
                  <td
                    class="value-cell"
                    style="width:25%; padding:0;"
                  >
                    <div
                      v-if="attr.galeria?.length"
                      class="photo-container"
                    >
                      <img
                        v-for="(image, i) in attr.galeria"
                        :key="i"
                        :src="resolveImgSrc(image)"
                        style="width: 100%; height: 280px; object-fit: contain; display: block;"
                        class="photo-img"
                      >
                    </div>
                  </td>

                  <!-- 3) Valor -->
                  <td
                    class="value-cell"
                    style="width:10%;"
                  >
                    {{
                      attr.options?.find(opt => opt.id === attr.default)?.label
                        ?? attr.default
                    }}
                  </td>

                  <!-- 4) Observación -->
                  <td
                    class="value-cell"
                    style="width:25%;"
                  >
                    {{ attr.obs ?? '—' }}
                  </td>
                </tr>

                <!-- photoCapture -->
                <!-- photoCapture -->
                <tr
                  v-for="(attr, index) in segmento.attributes.filter(attr => attr.type === 'photoCapture')"
                  :key="'photoCapture-' + index"
                >
                  <!-- Col 1: Label + Observation -->
                  <td
                    class="label-cell"
                    style="width: 30%; vertical-align: top;"
                  >
                    <strong>{{ attr.label }}</strong>
                    <div
                      v-if="attr.obs"
                      style="margin-top: 6px; font-weight: normal; font-style: italic; font-size: 0.9em; color: #475569;"
                    >
                      <strong>Obs:</strong> {{ attr.obs }}
                    </div>
                  </td>

                  <!-- Col 2: Photos -->
                  <td
                    class="value-cell"
                    style="width: 70%;"
                    colspan="3"
                  >
                    <div
                      v-if="(attr.galeria || []).length"
                      class="photo-container"
                    >
                      <img
                        v-for="(image, i) in attr.galeria"
                        :key="i"
                        :src="resolveImgSrc(image)"
                        alt="Foto"
                        class="photo-img"
                        style="width: 120px; height: 120px; object-fit: contain; margin: 4px; border: 1px solid #ddd;"
                      >
                    </div>
                    <div
                      v-else
                      style="color: #94a3b8; font-style: italic; padding: 4px;"
                    >
                      Sin registros fotográficos
                    </div>
                  </td>
                </tr>

                <!-- signature -->
                <tr
                  v-for="(attr, index) in (segmento.attributes || []).filter(a => a.type === 'signature')"
                  :key="'signature-' + index"
                >
                  <td
                    class="label-cell"
                    style="width: 30%; vertical-align: middle;"
                  >
                    <strong>{{ attr.label }}</strong>
                  </td>
                  <td
                    class="value-cell"
                    style="width: 70%;"
                    colspan="3"
                  >
                    <div v-if="attr.default" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; padding: 10px 0;">
                        <img
                          :src="resolveImgSrc(attr.default)"
                          alt="Firma del Cliente"
                          style="max-width: 350px; max-height: 200px; object-fit: contain; border: 1px solid #cbd5e1; border-radius: 8px; padding: 10px; background: #ffffff;"
                        >
                    </div>
                    <div v-else style="color: #94a3b8; font-style: italic; text-align: center; width: 100%; padding: 20px 0;">
                      Sin firma
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECKLIST (3 columnas fijas) ====== -->
                <tr v-if="(segmento.attributes || []).some(a => a.type === 'checkList')">
                  <td
                    class="label-cell-header"
                    style="width:50%;"
                  >
                    {{
                      segmento.attributes.find(a => a.type === 'checkList')?.titulos?.titulo1
                        ?? 'Item'
                    }}
                  </td>
                  <td
                    class="label-cell-header"
                    style="width:10%;"
                  >
                    {{
                      segmento.attributes.find(a => a.type === 'checkList')?.titulos?.titulo2
                        ?? 'Cumple / No cumple'
                    }}
                  </td>
                  <td
                    class="label-cell-header"
                    style="width:40%;"
                  >
                    {{
                      segmento.attributes.find(a => a.type === 'checkList')?.titulos?.titulo3
                        ?? 'Observación'
                    }}
                  </td>
                </tr>

                <template
                  v-for="(attr, aIndex) in segmento.attributes.filter(a => a.type === 'checkList')"
                  :key="'checkList-'+aIndex"
                >
                  <tr
                    v-for="(item, index) in attr.checkBoby"
                    :key="'checkListItem-' + index"
                  >
                    <!-- 1) Ítem -->
                    <td
                      class="label-cell"
                      style="width:50%;"
                    >
                      {{ item.label }}
                    </td>

                    <!-- 2) Valor -->
                    <td
                      class="value-cell"
                      style="width:10%;"
                    >
                      <span v-if="item.checked || item.value || item.default">
                        {{
                          item.options?.find(opt => opt.id === (item.value ?? item.default))?.label
                            ?? item.value ?? item.default ?? ''
                        }}
                      </span>
                    </td>

                    <!-- 3) Observación -->
                    <td
                      class="value-cell"
                      style="width:40%;"
                    >
                      {{ item.obs ?? '—' }}
                    </td>
                  </tr>
                </template>


                <!-- ====== OBSERVACION CONDUCTUAL ====== -->
                <tr
                  v-for="(attr, obsIdx) in (segmento.attributes || []).filter(a => a.type === 'checkListObservacionConductual')"
                  :key="'obs-cond-' + index + '-' + obsIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="em-wrap">
                      <div class="em-title">
                        {{ attr.label || 'Observación Conductual' }}
                      </div>
                      <table class="data-table" style="margin-top: 8px; width: 100%;">
                        <tbody>
                          <tr>
                            <td class="label-cell" style="width: 25%;">Centro</td>
                            <td class="value-cell" style="width: 25%;">{{ attr.datos?.centro ?? '—' }}</td>
                            <td class="label-cell" style="width: 25%;">Servicio</td>
                            <td class="value-cell" style="width: 25%;">{{ attr.datos?.servicio ?? '—' }}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Lugar de Tarea</td>
                            <td class="value-cell" colspan="3">{{ attr.datos?.lugarTarea ?? '—' }}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Cantidad de Personas</td>
                            <td class="value-cell">{{ attr.datos?.cantidadPersonas ?? '—' }}</td>
                            <td class="label-cell">Tipo de Conducta</td>
                            <td class="value-cell">
                              <span :style="attr.datos?.tipoConducta === 'RIESGOSA' ? 'color: red; font-weight: bold;' : 'color: green; font-weight: bold;'">
                                {{ attr.datos?.tipoConducta ?? '—' }}
                              </span>
                            </td>
                          </tr>
                          <tr v-if="attr.datos?.tipoConducta === 'RIESGOSA'">
                            <td class="label-cell">Causa de Conducta Riesgosa</td>
                            <td class="value-cell" colspan="3">
                              {{ attr.datos?.causaRiesgosa ?? '—' }}
                              <span v-if="attr.datos?.causaRiesgosa === 'Otros' && attr.datos?.otraCausa">
                                ({{ attr.datos?.otraCausa }})
                              </span>
                            </td>
                          </tr>
                          <tr>
                            <td class="label-cell">Descripción de Observación</td>
                            <td class="value-cell" colspan="3" style="white-space: pre-wrap;">{{ attr.datos?.descripcion ?? '—' }}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Medidas de Control</td>
                            <td class="value-cell" colspan="3" style="white-space: pre-wrap;">{{ attr.datos?.medidasControl ?? '—' }}</td>
                          </tr>
                          <tr v-if="attr.datos?.gps && (attr.datos.gps.lat || attr.datos.gps.lng)">
                            <td class="label-cell">Ubicación GPS:</td>
                            <td class="value-cell" colspan="3">
                              <div class="mb-2">
                                <strong>Latitud:</strong> {{ attr.datos.gps.lat }} | 
                                <strong>Longitud:</strong> {{ attr.datos.gps.lng }}
                              </div>
                            </td>
                          </tr>
                          <!-- Evidencia de Desviación (usr1) -->
                          <tr v-if="attr.datos?.fotosHallazgo && attr.datos.fotosHallazgo.length > 0">
                            <td class="label-cell">Fotos Desviación:</td>
                            <td class="value-cell" colspan="3">
                              <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                                <div v-for="(img, idx) in attr.datos.fotosHallazgo" :key="'img-hall-oc-' + idx" style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px; background: #fff;">
                                  <img :src="resolveImgSrc(img)" style="width: 150px; height: 110px; object-fit: cover; border-radius: 2px; display: block;" alt="Foto Desviación">
                                </div>
                              </div>
                            </td>
                          </tr>

                          <!-- Bloque de Cierre de Desviación (usr2 o In Situ) -->
                          <tr v-if="attr.datos?.tipoConducta === 'RIESGOSA' && (attr.datos?.cerrarInSitu === 'NO' || attr.datos?.cerrarInSitu === 'SI')">
                            <td class="label-cell" style="background-color: #faf5ff; border-top: 2px solid #8b5cf6;">Cierre de Desviación</td>
                            <td class="value-cell" colspan="3" style="background-color: #faf5ff; border-top: 2px solid #8b5cf6; padding: 8px;">
                              <table style="width: 100%; border-collapse: collapse;">
                                <tbody>
                                  <tr>
                                    <td style="width: 30%; font-weight: bold; padding: 4px 0;">Superior Asignado:</td>
                                    <td style="padding: 4px 0;">{{ getNombreSuperiorAsignado() }}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-weight: bold; padding: 4px 0;">Fecha Compromiso:</td>
                                    <td style="padding: 4px 0;">{{ attr.datos?.fechaCompromiso || '—' }}</td>
                                  </tr>
                                  <tr>
                                    <td style="font-weight: bold; padding: 4px 0;">Comentarios de Cierre:</td>
                                    <td style="padding: 4px 0; white-space: pre-wrap;">{{ attr.datos?.comentariosCierre || '—' }}</td>
                                  </tr>
                                  <tr v-if="attr.datos?.fotosCierre && attr.datos.fotosCierre.length > 0">
                                    <td style="font-weight: bold; padding: 4px 0;">Fotos Cierre (Evidencia):</td>
                                    <td style="padding: 4px 0;">
                                      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                                        <div v-for="(img, idx) in attr.datos.fotosCierre" :key="'img-cier-oc-' + idx" style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px; background: #fff;">
                                          <img :src="resolveImgSrc(img)" style="width: 150px; height: 110px; object-fit: cover; border-radius: 2px; display: block;" alt="Foto Cierre">
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr v-if="attr.datos?.gpsCierre && attr.datos.gpsCierre.lat">
                                    <td style="font-weight: bold; padding: 4px 0;">Ubicación Cierre GPS:</td>
                                    <td style="padding: 4px 0;">
                                      <div class="mb-1"><strong>Latitud:</strong> {{ attr.datos.gpsCierre.lat }} | <strong>Longitud:</strong> {{ attr.datos.gpsCierre.lng }}</div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- geoLocation -->
                <tr
                  v-for="(attr, index) in segmento.attributes.filter(attr => attr.type === 'geoLocation')"
                  :key="'geoLocation-' + index"
                >
                  <td class="label-cell">
                    Geolocalización:
                  </td>
                  <td class="value-cell" colspan="3">
                    <div class="mb-1">
                      <strong>📍 Obra (Destino):</strong>
                      <span v-if="getLat(attr) && getLng(attr)">
                        Lat: {{ Number(getLat(attr)).toFixed(6) }} | Lng: {{ Number(getLng(attr)).toFixed(6) }}
                      </span>
                      <span v-else class="text-slate-400 italic">Sin coordenadas fijadas</span>
                    </div>
                    <div v-if="attr.geoVisita || attr.default?.geoVisita || attr.value?.lat" class="mt-1 pt-1 border-t border-slate-200">
                      <strong>📍 Registro Técnico en Terreno:</strong>
                      <span>
                        Lat: {{ Number(attr.geoVisita?.lat || attr.default?.geoVisita?.lat || attr.value?.lat || 0).toFixed(6) }} | Lng: {{ Number(attr.geoVisita?.lng || attr.default?.geoVisita?.lng || attr.value?.lng || 0).toFixed(6) }}
                        <span v-if="attr.geoVisita?.hora || attr.default?.geoVisita?.hora || attr.value?.hora"> ({{ attr.geoVisita?.hora || attr.default?.geoVisita?.hora || attr.value?.hora }})</span>
                      </span>
                    </div>
                  </td>
                </tr>

                <!-- etiquetas o separadores -->
                <tr
                  v-for="(attr, index) in segmento.attributes.filter(attr =>
                    ['newLine', 'labelLine', 'labelLineH1', 'labelLineH2', 'labelLineH3', 'labelLineH4', 'labelLineH5'].includes(attr.type)
                  )"
                  :key="'label-line-' + index"
                >
                  <td colspan="4">
                    <template v-if="attr.type === 'newLine'">
                      <hr>
                    </template>
                    <template v-else-if="attr.type === 'labelLine'">
                      <span>{{ attr.text }}</span>
                    </template>
                    <template v-else-if="attr.type === 'labelLineH1'">
                      <h1>{{ attr.text }}</h1>
                    </template>
                    <template v-else-if="attr.type === 'labelLineH2'">
                      <h2>{{ attr.text }}</h2>
                    </template>
                    <template v-else-if="attr.type === 'labelLineH3'">
                      <h3>{{ attr.text }}</h3>
                    </template>
                    <template v-else-if="attr.type === 'labelLineH4'">
                      <h4>{{ attr.text }}</h4>
                    </template>
                    <template v-else-if="attr.type === 'labelLineH5'">
                      <h5>{{ attr.text }}</h5>
                    </template>
                  </td>
                </tr>

                <!-- verDoc: documentos publicados por id_doc -->
                <tr
                  v-for="(attr, i) in (segmento.attributes || []).filter(a => a.type === 'verDoc')"
                  :key="'verDoc-' + index + '-' + i"
                  class="page-break-row"
                >
                  <td
                    class="value-cell"
                    colspan="4"
                    style="padding: 0; border: none;"
                  >
                    <div class="verdoc-page-break">
                      <VerDoc :attr="attr" />
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK TECLES ====== -->
                <tr
                  v-for="(attr, chIdx) in (segmento.attributes || []).filter(a => a.type === 'checkListTecles')"
                  :key="'checkListTecles-' + index + '-' + chIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table tecles-table">
                        <colgroup>
                          <col style="width:25%;">
                          <col style="width:5%;">
                          <col style="width:5%;">
                          <col style="width:5%;">
                          <col style="width:5%;">
                          <col style="width:5%;">
                          <col style="width:3.5%;">
                          <col style="width:3.5%;">
                          <col style="width:3.5%;">
                          <col style="width:39.5%;">
                        </colgroup>
                        <thead>
                          <tr>
                            <th class="tecles-head-left">
                              EMPRESA:
                            </th>
                            <th class="vibro-day-cell">
                              L
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              J
                            </th>
                            <th class="vibro-day-cell">
                              V
                            </th>
                            <th class="tecles-state-head">
                              SI
                            </th>
                            <th class="tecles-state-head">
                              NO
                            </th>
                            <th class="tecles-state-head">
                              No Aplica
                            </th>
                            <th class="tecles-obs-head">
                              OBSERVACIONES
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              class="tecles-section"
                              colspan="10"
                            >
                              DE CADENA
                            </td>
                          </tr>
                          <tr
                            v-for="(item, itemIdx) in getTeclesRows(attr)"
                            :key="'tech-item-' + itemIdx"
                          >
                            <td class="tecles-item-cell">
                              {{ itemIdx + 1 }} {{ getSpecialItemLabel(item) || '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'v') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasResultMark(item, 'si') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasResultMark(item, 'no') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasResultMark(item, 'na') ? 'X' : '' }}
                            </td>
                            <td class="tecles-obs-cell">
                              {{ getSpecialObs(item) || '' }}
                            </td>
                          </tr>
                          <tr>
                            <td
                              colspan="10"
                              class="vibro-footer-cell"
                            >
                              <div class="vibro-result-grid">
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getVibroResultado(attr) === 'aprobada' }"
                                >
                                  APROBADA
                                </div>
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getVibroResultado(attr) === 'reprobada' }"
                                >
                                  REPROBADA
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK MONOFASICO / TRIFASICO ====== -->
                <tr
                  v-for="(attr, monoIdx) in (segmento.attributes || []).filter(a => a.type === 'checkMonofasicoTrifasico')"
                  :key="'mono-' + index + '-' + monoIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="mono-wrap">
                      <h4 class="mono-title">
                        {{ attr.label || 'CHECK MONOFASICO TRIFASICO (PRUEBA)' }}
                      </h4>

                      <table class="data-table mono-table">
                        <thead>
                          <tr>
                            <th
                              class="mono-head-item"
                              rowspan="2"
                            >
                              Elemento a inspeccionar
                            </th>
                            <th
                              class="mono-head-days"
                              colspan="5"
                            >
                              DIA
                            </th>
                            <th
                              class="mono-head-date"
                              rowspan="2"
                            >
                              Fecha reparacion
                            </th>
                            <th
                              class="mono-head-obs"
                              rowspan="2"
                            >
                              Observaciones
                            </th>
                          </tr>
                          <tr>
                            <th class="mono-day-cell">
                              L
                            </th>
                            <th class="mono-day-cell">
                              M
                            </th>
                            <th class="mono-day-cell">
                              M
                            </th>
                            <th class="mono-day-cell">
                              J
                            </th>
                            <th class="mono-day-cell">
                              V
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, rIdx) in getSpecialRows(attr)"
                            :key="'mono-row-' + monoIdx + '-' + rIdx"
                          >
                            <td class="mono-item-cell">
                              {{ getSpecialItemLabel(item) || '—' }}
                            </td>
                            <td class="mono-check-cell">
                              {{ hasDayMark(item, 'l') ? 'X' : '' }}
                            </td>
                            <td class="mono-check-cell">
                              {{ hasDayMark(item, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="mono-check-cell">
                              {{ hasDayMark(item, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="mono-check-cell">
                              {{ hasDayMark(item, 'j') ? 'X' : '' }}
                            </td>
                            <td class="mono-check-cell">
                              {{ hasDayMark(item, 'v') ? 'X' : '' }}
                            </td>
                            <td class="mono-date-cell">
                              {{ getRepairDate(item) }}
                            </td>
                            <td class="mono-obs-cell">
                              {{ getSpecialObs(item) || '' }}
                            </td>
                          </tr>
                          <tr v-if="!getSpecialRows(attr).length">
                            <td
                              colspan="8"
                              class="value-cell"
                              style="text-align:center;"
                            >
                              — Sin registros —
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== REGISTRO INGRESO (ACCESOS) ====== -->
                <tr
                  v-for="(attr, ingIdx) in (segmento.attributes || []).filter(a => a.type === 'ingresoZanja')"
                  :key="'ingreso-' + index + '-' + ingIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table ingreso-table">
                        <colgroup>
                          <col style="width:25%;">
                          <col
                            v-for="n in 16"
                            :key="'ing-col-'+n"
                            style="width:4.6875%;"
                          >
                        </colgroup>
                        <thead>
                          <tr>
                            <th
                              class="ingreso-name-head"
                              rowspan="2"
                            >
                              NOMBRE TRABAJADOR:
                            </th>
                            <th
                              v-for="n in 8"
                              :key="'ing-h-'+n"
                              class="ingreso-access-head"
                              colspan="2"
                            >
                              ACCESO {{ n }}
                            </th>
                          </tr>
                          <tr>
                            <template
                              v-for="n in 8"
                              :key="'ing-sh-'+n"
                            >
                              <th class="ingreso-sub-head">
                                Hora Entrada
                              </th>
                              <th class="ingreso-sub-head">
                                Hora Salida
                              </th>
                            </template>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(row, rIdx) in getIngresoRows(attr)"
                            :key="'ing-r-'+ingIdx+'-'+rIdx"
                          >
                            <td class="ingreso-name-cell">
                              {{ row.nombre }}
                            </td>
                            <template
                              v-for="n in 8"
                              :key="'ing-c-'+rIdx+'-'+n"
                            >
                              <td class="ingreso-time-cell">
                                {{ getIngresoTime(row, n, 'entrada') }}
                              </td>
                              <td class="ingreso-time-cell">
                                {{ getIngresoTime(row, n, 'salida') }}
                              </td>
                            </template>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHEQUEO EXTENSION ELECTRICA ====== -->
                <tr
                  v-for="(attr, exIdx) in (segmento.attributes || []).filter(a => a.type === 'chequeoExtensionElectrica')"
                  :key="'ext-' + index + '-' + exIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <template
                        v-for="(group, gIdx) in getExtensionGroups(attr)"
                        :key="'ext-g-'+exIdx+'-'+gIdx"
                      >
                        <table class="data-table ext-table">
                          <thead>
                            <tr>
                              <th class="vibro-head-left">
                                EMPRESA:
                              </th>
                              <th class="vibro-day-cell">
                                L
                              </th>
                              <th class="vibro-day-cell">
                                M
                              </th>
                              <th class="vibro-day-cell">
                                M
                              </th>
                              <th class="vibro-day-cell">
                                J
                              </th>
                              <th class="vibro-day-cell">
                                V
                              </th>
                              <th class="vibro-head-obs">
                                OBSERVACIONES
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td
                                class="ext-section"
                                colspan="6"
                              >
                                EXTENSION ELECTRICA N ° {{ group.numero }}
                              </td>
                              <td class="vibro-obs-cell" />
                            </tr>
                            <tr
                              v-for="(row, rIdx) in group.rows"
                              :key="'ext-row-'+gIdx+'-'+rIdx"
                            >
                              <td class="vibro-item-cell">
                                {{ row.label }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'l') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'ma') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'mi') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'j') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'v') ? 'X' : '' }}
                              </td>
                              <td class="vibro-obs-cell">
                                {{ getSpecialObs(row.data) || '' }}
                              </td>
                            </tr>
                            <tr>
                              <td
                                colspan="7"
                                class="vibro-footer-cell"
                              >
                                <div class="vibro-result-grid">
                                  <div
                                    class="vibro-result-label"
                                    :class="{ 'vibro-result-selected': group.resultado === 'aprobada' }"
                                  >
                                    APROBADA
                                  </div>
                                  <div
                                    class="vibro-result-label"
                                    :class="{ 'vibro-result-selected': group.resultado === 'reprobada' }"
                                  >
                                    REPROBADA
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </template>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECKLIST HERRAMIENTAS MANUALES ====== -->
                <tr
                  v-for="(attr, hmIdx) in (segmento.attributes || []).filter(a => a.type === 'checkListHerramientasManuales')"
                  :key="'hm-' + index + '-' + hmIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table hm-table">
                        <thead>
                          <tr>
                            <th class="hm-left-head" />
                            <th
                              class="hm-days-head"
                              colspan="5"
                            >
                              Condiciones
                            </th>
                            <th
                              class="hm-obs-head"
                              rowspan="2"
                            >
                              Observaciones
                            </th>
                          </tr>
                          <tr>
                            <th class="hm-title-head">
                              Herramientas Manuales
                            </th>
                            <th class="vibro-day-cell">
                              L
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              J
                            </th>
                            <th class="vibro-day-cell">
                              V
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(row, rIdx) in getManualToolsRows1(attr)"
                            :key="'hm-r1-' + hmIdx + '-' + rIdx"
                          >
                            <td :class="row.highlight ? 'hm-item-highlight' : 'hm-item'">
                              {{ row.label }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'v') ? 'X' : '' }}
                            </td>
                            <td class="hm-obs-cell">
                              {{ getSpecialObs(row.data) || '' }}
                            </td>
                          </tr>

                          <tr>
                            <td
                              class="hm-note-cell"
                              colspan="7"
                            >
                              NOTA: VERIFICAR AISLACIÓN DE ESTAS HERRAMIENTAS
                            </td>
                          </tr>

                          <tr>
                            <td class="hm-section2-head">
                              TRABAJOS MECÁNICOS
                            </td>
                            <td class="hm-days-inline-head">
                              L
                            </td>
                            <td class="hm-days-inline-head">
                              M
                            </td>
                            <td class="hm-days-inline-head">
                              M
                            </td>
                            <td class="hm-days-inline-head">
                              J
                            </td>
                            <td class="hm-days-inline-head">
                              V
                            </td>
                            <td class="hm-days-inline-head hm-inline-obs">
                              Observaciones
                            </td>
                          </tr>

                          <tr
                            v-for="(row, rIdx) in getManualToolsRows2(attr)"
                            :key="'hm-r2-' + hmIdx + '-' + rIdx"
                          >
                            <td class="hm-item">
                              {{ row.label }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'v') ? 'X' : '' }}
                            </td>
                            <td class="hm-obs-cell">
                              {{ getSpecialObs(row.data) || '' }}
                            </td>
                          </tr>

                          <tr>
                            <td
                              class="hm-note-cell hm-bottom-note"
                              colspan="7"
                            >
                              NOTA: ELIMINAR Y REQUISAR HERRAMIENTAS HECHIZAS ESTÁN PROHIBIDAS EN LA EMPRESA
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== INSPECCION CAMION ====== -->
                <tr
                  v-for="(attr, camIdx) in (segmento.attributes || []).filter(isTruckInspectionAttr)"
                  :key="'camion-' + index + '-' + camIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table camion-table">
                        <colgroup>
                          <col style="width:25%;">
                          <col
                            v-for="n in 12"
                            :key="'cam-col-'+n"
                            style="width:6.25%;"
                          >
                        </colgroup>
                        <thead>
                          <tr>
                            <th class="cam-left-head">
                              MES:
                            </th>
                            <th
                              class="cam-week-head cam-week-1"
                              colspan="3"
                            >
                              1ra semana<br>CUMPLE
                            </th>
                            <th
                              class="cam-week-head cam-week-2"
                              colspan="3"
                            >
                              2da semana<br>CUMPLE
                            </th>
                            <th
                              class="cam-week-head cam-week-1"
                              colspan="3"
                            >
                              3ra semana<br>CUMPLE
                            </th>
                            <th
                              class="cam-week-head cam-week-2"
                              colspan="3"
                            >
                              4ta semana<br>CUMPLE
                            </th>
                          </tr>
                          <tr>
                            <th class="cam-left-head">
                              EMPRESA:
                            </th>
                            <th class="cam-si">
                              SI
                            </th><th class="cam-no">
                              NO
                            </th><th class="cam-na">
                              N/A
                            </th>
                            <th class="cam-si">
                              SI
                            </th><th class="cam-no">
                              NO
                            </th><th class="cam-na">
                              N/A
                            </th>
                            <th class="cam-si">
                              SI
                            </th><th class="cam-no">
                              NO
                            </th><th class="cam-na">
                              N/A
                            </th>
                            <th class="cam-si">
                              SI
                            </th><th class="cam-no">
                              NO
                            </th><th class="cam-na">
                              N/A
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(row, rIdx) in getTruckRowsForPrint(attr)"
                            :key="'cam-row-' + camIdx + '-' + rIdx"
                          >
                            <template v-if="row.isSection">
                              <td
                                class="cam-section"
                                colspan="13"
                              >
                                {{ row.label }}
                              </td>
                            </template>
                            <template v-else>
                              <td class="cam-item">
                                {{ row.label }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 1, 'si') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 1, 'no') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 1, 'na') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 2, 'si') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 2, 'no') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 2, 'na') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 3, 'si') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 3, 'no') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 3, 'na') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 4, 'si') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 4, 'no') }}
                              </td>
                              <td class="cam-mark-cell">
                                {{ getTruckWeekMark(row.data, 4, 'na') }}
                              </td>
                            </template>
                          </tr>

                          <tr>
                            <td class="cam-week-col">
                              Semana
                            </td>
                            <td
                              class="cam-section"
                              colspan="6"
                            >
                              CAUSAS O MOTIVOS DE LAS OBSERVACIONES DETECTADAS.
                            </td>
                            <td
                              class="cam-section"
                              colspan="6"
                            >
                              ACCIÓN A REALIZAR/ RESPONSABLE
                            </td>
                          </tr>
                          <tr>
                            <td class="cam-week-col">
                              1°
                            </td>
                            <td colspan="6" />
                            <td colspan="6" />
                          </tr>
                          <tr>
                            <td class="cam-week-col">
                              2°
                            </td>
                            <td colspan="6" />
                            <td colspan="6" />
                          </tr>
                          <tr>
                            <td class="cam-week-col">
                              3°
                            </td>
                            <td colspan="6" />
                            <td colspan="6" />
                          </tr>
                          <tr>
                            <td class="cam-week-col">
                              4°
                            </td>
                            <td colspan="6" />
                            <td colspan="6" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK DISPENSADOR AGUA POTABLE ====== -->
                <tr
                  v-for="(attr, dispIdx) in (segmento.attributes || []).filter(a => a.type === 'checkDispensadorAguaPotable')"
                  :key="'dispensador-' + index + '-' + dispIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table disp-table">
                        <thead>
                          <tr>
                            <th class="disp-act-col">
                              ACTIVIDAD
                            </th>
                            <th class="vibro-day-cell">
                              L
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              J
                            </th>
                            <th class="vibro-day-cell">
                              V
                            </th>
                            <th class="disp-resp-col">
                              RESPONSABLE
                            </th>
                            <th class="disp-fecha-col">
                              FECHA
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td class="disp-subhead-cell">
                              1.0&nbsp;&nbsp;&nbsp;CÓDIGO DE FALLAS
                            </td>
                            <td class="vibro-mark-cell" />
                            <td class="vibro-mark-cell" />
                            <td class="vibro-mark-cell" />
                            <td class="vibro-mark-cell" />
                            <td class="vibro-mark-cell" />
                            <td class="disp-blank-cell" />
                            <td class="disp-blank-cell" />
                          </tr>

                          <tr
                            v-for="(row, rIdx) in getDispRowsForPrint(attr)"
                            :key="'disp-row-' + dispIdx + '-' + rIdx"
                          >
                            <td class="disp-item-cell">
                              {{ row.code }}&nbsp;&nbsp;{{ row.label }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(row.data, 'v') ? 'X' : '' }}
                            </td>
                            <td class="disp-blank-cell">
                              {{ row.data?.responsable ?? '' }}
                            </td>
                            <td class="disp-blank-cell">
                              {{ formatDate(row.data?.fecha) || row.data?.fecha || '' }}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <table class="data-table disp-obs-table">
                        <tbody>
                          <tr>
                            <td class="disp-obs-title">
                              OBSERVACIONES: <span class="disp-obs-line">{{ getDispObs(attr) }}</span>
                            </td>
                          </tr>
                          <tr
                            v-for="n in 5"
                            :key="'disp-obs-line-' + dispIdx + '-' + n"
                          >
                            <td class="disp-obs-empty" />
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK EQUIPOS ILUMINACION ====== -->
                <tr
                  v-for="(attr, iluIdx) in (segmento.attributes || []).filter(a => a.type === 'checkEquiposIluminacion')"
                  :key="'iluminacion-' + index + '-' + iluIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table ilum-table">
                        <thead>
                          <tr>
                            <th class="ilum-head-left">
                              Elemento
                            </th>
                            <th
                              class="ilum-head-state"
                              colspan="5"
                            >
                              Estado
                            </th>
                            <th
                              class="ilum-head-obs"
                              rowspan="2"
                            >
                              Observaciones
                            </th>
                          </tr>
                          <tr>
                            <th class="ilum-head-left" />
                            <th class="vibro-day-cell">
                              L
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              J
                            </th>
                            <th class="vibro-day-cell">
                              V
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(row, rIdx) in getIlumRowsForPrint(attr)"
                            :key="'ilum-item-' + iluIdx + '-' + rIdx"
                          >
                            <template v-if="row.isSection">
                              <td
                                class="ilum-section-cell"
                                colspan="7"
                              >
                                {{ row.label }}
                              </td>
                            </template>
                            <template v-else>
                              <td class="ilum-item-cell">
                                {{ row.label }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'l') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'ma') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'mi') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'j') ? 'X' : '' }}
                              </td>
                              <td class="vibro-mark-cell">
                                {{ hasDayMark(row.data, 'v') ? 'X' : '' }}
                              </td>
                              <td class="ilum-obs-cell">
                                {{ getSpecialObs(row.data) || '' }}
                              </td>
                            </template>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK MARTILLO DEMOLEDOR ====== -->
                <tr
                  v-for="(attr, marIdx) in (segmento.attributes || []).filter(a => a.type === 'checkeoMartilloDemoledor')"
                  :key="'martillo-' + index + '-' + marIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table martillo-table">
                        <thead>
                          <tr>
                            <th
                              class="martillo-head-left"
                              colspan="2"
                            >
                              EMPRESA: {{ getVibroEmpresa(attr) }}
                            </th>
                            <th class="vibro-day-cell">
                              L
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              J
                            </th>
                            <th class="vibro-day-cell">
                              V
                            </th>
                            <th class="vibro-head-obs">
                              OBSERVACION
                            </th>
                          </tr>
                          <tr>
                            <th class="martillo-n-col">
                              N°
                            </th>
                            <th class="martillo-item-head">
                              VERIFICACIÓN ESTRUCTURAL
                            </th>
                            <th class="vibro-day-cell" />
                            <th class="vibro-day-cell" />
                            <th class="vibro-day-cell" />
                            <th class="vibro-day-cell" />
                            <th class="vibro-day-cell" />
                            <th class="vibro-head-obs" />
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(item, rIdx) in getSpecialRows(attr)"
                            :key="'mart-item-' + marIdx + '-' + rIdx"
                          >
                            <td class="martillo-n-col">
                              {{ rIdx + 1 }}
                            </td>
                            <td class="martillo-item-cell">
                              {{ getSpecialItemLabel(item) || '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'v') ? 'X' : '' }}
                            </td>
                            <td class="vibro-obs-cell">
                              {{ getSpecialObs(item) || '' }}
                            </td>
                          </tr>

                          <tr v-if="!getSpecialRows(attr).length">
                            <td
                              class="value-cell"
                              colspan="8"
                              style="text-align:center;"
                            >
                              — Sin registros —
                            </td>
                          </tr>

                          <tr>
                            <td
                              colspan="8"
                              class="vibro-footer-cell"
                            >
                              <div class="vibro-result-grid">
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getMartilloResultado(attr) === 'aprobada' }"
                                >
                                  APROBADA
                                </div>
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getMartilloResultado(attr) === 'reprobada' }"
                                >
                                  REPROBADA
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div
                        v-if="getMartilloObs(attr)"
                        class="martillo-obs-note"
                      >
                        <strong>OBSERVACIONES:</strong> {{ getMartilloObs(attr) }}
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK BETONERA ====== -->
                <tr
                  v-for="(attr, betIdx) in (segmento.attributes || []).filter(a => a.type === 'chequeoSeguridadBetonera')"
                  :key="'betonera-' + index + '-' + betIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table vibro-table">
                        <thead>
                          <tr>
                            <th class="vibro-head-left">
                              EMPRESA: {{ getVibroEmpresa(attr) }}
                            </th>
                            <th class="vibro-day-cell">
                              L
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              J
                            </th>
                            <th class="vibro-day-cell">
                              V
                            </th>
                            <th class="vibro-head-obs">
                              OBSERVACIÓN
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              class="betonera-detail-cell"
                              colspan="6"
                            >
                              DETALLE: CHECK CUMPLE. CRUZ NO CUMPLE. NO APLICA N/A
                            </td>
                            <td class="vibro-obs-cell" />
                          </tr>

                          <tr
                            v-for="(item, rIdx) in getSpecialRows(attr)"
                            :key="'bet-item-' + betIdx + '-' + rIdx"
                          >
                            <td class="vibro-item-cell">
                              {{ getVibroItemText(item, rIdx) }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'v') ? 'X' : '' }}
                            </td>
                            <td class="vibro-obs-cell">
                              {{ getSpecialObs(item) || '' }}
                            </td>
                          </tr>

                          <tr v-if="!getSpecialRows(attr).length">
                            <td
                              class="value-cell"
                              colspan="7"
                              style="text-align:center;"
                            >
                              — Sin registros —
                            </td>
                          </tr>

                          <tr>
                            <td
                              colspan="7"
                              class="vibro-footer-cell"
                            >
                              <div class="vibro-result-grid">
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getBetoneraResultado(attr) === 'aprobada' }"
                                >
                                  APROBADA
                                </div>
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getBetoneraResultado(attr) === 'reprobada' }"
                                >
                                  REPROBADA
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK VIBROPISON ====== -->
                <tr
                  v-for="(attr, vibroIdx) in (segmento.attributes || []).filter(a => a.type === 'vibropison')"
                  :key="'vibro-' + index + '-' + vibroIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="vibro-wrap">
                      <table class="data-table vibro-table">
                        <thead>
                          <tr>
                            <th class="vibro-head-left">
                              EMPRESA: {{ getVibroEmpresa(attr) }}
                            </th>
                            <th class="vibro-day-cell">
                              L
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              M
                            </th>
                            <th class="vibro-day-cell">
                              J
                            </th>
                            <th class="vibro-day-cell">
                              V
                            </th>
                            <th class="vibro-head-obs">
                              OBSERVACION
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td
                              class="vibro-section"
                              colspan="7"
                            >
                              DEL EQUIPO
                            </td>
                          </tr>

                          <tr
                            v-for="(item, rIdx) in getVibroEquipoRows(attr)"
                            :key="'vibro-eq-' + vibroIdx + '-' + rIdx"
                          >
                            <td class="vibro-item-cell">
                              {{ getVibroItemText(item, rIdx) }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'v') ? 'X' : '' }}
                            </td>
                            <td class="vibro-obs-cell">
                              {{ getSpecialObs(item) || '' }}
                            </td>
                          </tr>

                          <tr>
                            <td
                              class="vibro-section"
                              colspan="7"
                            >
                              OTROS
                            </td>
                          </tr>

                          <tr
                            v-for="(item, oIdx) in getVibroOtrosRows(attr)"
                            :key="'vibro-ot-' + vibroIdx + '-' + oIdx"
                          >
                            <td class="vibro-item-cell">
                              {{ getVibroItemText(item, getVibroEquipoRows(attr).length + oIdx) }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'l') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'ma') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'mi') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'j') ? 'X' : '' }}
                            </td>
                            <td class="vibro-mark-cell">
                              {{ hasDayMark(item, 'v') ? 'X' : '' }}
                            </td>
                            <td class="vibro-obs-cell">
                              {{ getSpecialObs(item) || '' }}
                            </td>
                          </tr>

                          <tr v-if="!getSpecialRows(attr).length">
                            <td
                              class="value-cell"
                              colspan="7"
                              style="text-align:center;"
                            >
                              — Sin registros —
                            </td>
                          </tr>

                          <tr>
                            <td
                              colspan="7"
                              class="vibro-footer-cell"
                            >
                              <div class="vibro-result-grid">
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getVibroResultado(attr) === 'aprobada' }"
                                >
                                  APROBADA
                                </div>
                                <div
                                  class="vibro-result-label"
                                  :class="{ 'vibro-result-selected': getVibroResultado(attr) === 'reprobada' }"
                                >
                                  REPROBADA
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK EXTINTORES ====== -->
                <tr
                  v-for="(attr, extIdx) in (segmento.attributes || []).filter(a => ['checkExtintores', 'checkextintores', 'CHECK EXTINTORES'].includes(a.type))"
                  :key="'extintores-' + index + '-' + extIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="extintor-print-wrap">
                      <template v-if="getExtintorRowsForPrint(attr).length">
                        <div
                          v-for="(ext, rowIdx) in getExtintorRowsForPrint(attr)"
                          :key="'ext-row-' + extIdx + '-' + rowIdx"
                          class="extintor-card"
                        >
                          <div class="extintor-card-title">
                            EXTINTOR {{ rowIdx + 1 }}
                          </div>
                          <table class="data-table extintor-vertical-table">
                            <thead>
                              <tr>
                                <th class="extintor-concept-col">
                                  CONCEPTO
                                </th>
                                <th class="extintor-state-col">
                                  ESTADO
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td class="extintor-concept-col">
                                  Capacidad nominal del extintor (KG)
                                </td>
                                <td class="extintor-state-col">
                                  {{ ext.capacidadNominal || '—' }}
                                </td>
                              </tr>
                              <tr>
                                <td class="extintor-concept-col">
                                  Potencial de extinción
                                </td>
                                <td class="extintor-state-col">
                                  {{ ext.potencialExtincion || '—' }}
                                </td>
                              </tr>
                              <tr
                                v-for="(label, cIdx) in getExtintorCheckLabels(attr, ext)"
                                :key="'ext-c-' + extIdx + '-' + rowIdx + '-' + cIdx"
                              >
                                <td class="extintor-concept-col">
                                  {{ label }}
                                </td>
                                <td class="extintor-state-col">
                                  {{ getExtintorCheckValue(ext, cIdx) || '—' }}
                                </td>
                              </tr>
                              <tr>
                                <td class="extintor-concept-col">
                                  Clase del extintor
                                </td>
                                <td class="extintor-state-col">
                                  {{ ext.claseExtintor || '—' }}
                                </td>
                              </tr>
                              <tr>
                                <td class="extintor-concept-col">
                                  Ubicación
                                </td>
                                <td class="extintor-state-col">
                                  {{ ext.ubicacion || '—' }}
                                </td>
                              </tr>
                              <tr>
                                <td class="extintor-concept-col">
                                  N° de sello
                                </td>
                                <td class="extintor-state-col">
                                  {{ ext.nroSello || '—' }}
                                </td>
                              </tr>
                              <tr>
                                <td class="extintor-concept-col">
                                  Fecha de vencimiento
                                </td>
                                <td class="extintor-state-col">
                                  {{ formatDate(ext.fechaVencimiento) || ext.fechaVencimiento || '—' }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </template>
                      <div
                        v-else
                        class="value-cell"
                        style="text-align:center;"
                      >
                        — Sin registros de extintores —
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK EPP ====== -->
                <tr
                  v-for="(attr, eppIdx) in (segmento.attributes || []).filter(a => ['checkEpp', 'checkEPP', 'inspeccionEpp', 'inspeccionEPP'].includes(a.type))"
                  :key="'epp-' + index + '-' + eppIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="epp-print-wrap">
                      <template v-if="getEppRowsForPrint(attr).length">
                        <div
                          v-for="(row, rowIdx) in getEppRowsForPrint(attr)"
                          :key="'epp-row-' + eppIdx + '-' + rowIdx"
                          class="epp-card"
                        >
                          <div class="epp-card-title">
                            REGISTRO {{ rowIdx + 1 }}
                            <span v-if="row.nombre"> - {{ row.nombre }}</span>
                            <span v-if="row.cargo"> ({{ row.cargo }})</span>
                          </div>

                          <table class="data-table epp-print-table">
                            <thead>
                              <tr>
                                <th class="epp-item-col">
                                  Elemento
                                </th>
                                <th class="epp-state-col">
                                  Estado
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(item, iIdx) in row.items"
                                :key="'epp-item-' + eppIdx + '-' + rowIdx + '-' + iIdx"
                              >
                                <td class="epp-item-col">
                                  {{ item.label }}
                                </td>
                                <td class="epp-state-col">
                                  {{ getEppStateLabel(item.estado) || '—' }}
                                </td>
                              </tr>
                              <tr>
                                <td class="epp-item-col">
                                  Observación general
                                </td>
                                <td class="epp-state-col epp-obs-cell">
                                  {{ row.observacionGeneral || '—' }}
                                </td>
                              </tr>
                              <tr>
                                <td class="epp-item-col">
                                  Foto
                                </td>
                                <td class="epp-state-col epp-photo-cell">
                                  <div
                                    v-if="row.galeria.length"
                                    class="mc-img-wrap"
                                  >
                                    <img
                                      v-for="(foto, fIdx) in row.galeria"
                                      :key="'epp-foto-' + eppIdx + '-' + rowIdx + '-' + fIdx"
                                      :src="resolveImgSrc(foto)"
                                      class="mc-img"
                                    >
                                  </div>
                                  <span v-else>—</span>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </template>
                      <div
                        v-else
                        class="value-cell"
                        style="text-align:center;"
                      >
                        — Sin registros EPP —
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECK BAÑOS E INSTALACIONES ====== -->
                <tr
                  v-for="(attr, banIdx) in (segmento.attributes || []).filter(a => ['checkBanosInstalaciones', 'checkBanos', 'CHECK BANOS INSTALACIONES'].includes(a.type))"
                  :key="'banos-' + index + '-' + banIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="banos-print-wrap">
                      <template v-if="getBanosBlocksForPrint(attr).length">
                        <div
                          v-for="(block, bIdx) in getBanosBlocksForPrint(attr)"
                          :key="'banos-block-' + banIdx + '-' + bIdx"
                          class="banos-block"
                        >
                          <div class="banos-block-title">
                            {{ block.title || `Bloque ${bIdx + 1}` }}
                          </div>
                          <table class="data-table banos-print-table">
                            <thead>
                              <tr>
                                <th class="banos-num-col">
                                  N°
                                </th>
                                <th class="banos-question-col">
                                  Pregunta
                                </th>
                                <th class="banos-state-col">
                                  Estado
                                </th>
                                <th class="banos-obs-col">
                                  Observación
                                </th>
                                <th class="banos-date-col">
                                  Fecha Corrección
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(item, iIdx) in block.items"
                                :key="'ban-item-' + banIdx + '-' + bIdx + '-' + iIdx"
                              >
                                <td class="banos-num-col">
                                  {{ item.numero || (iIdx + 1) }}
                                </td>
                                <td class="banos-question-col">
                                  {{ item.pregunta || '—' }}
                                </td>
                                <td class="banos-state-col">
                                  {{ getBanosStateLabel(item.estado) || '—' }}
                                </td>
                                <td class="banos-obs-col">
                                  {{ item.observacion || '—' }}
                                </td>
                                <td class="banos-date-col">
                                  {{ formatDate(item.fechaCorreccion) || item.fechaCorreccion || '—' }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </template>
                      <div
                        v-else
                        class="value-cell"
                        style="text-align:center;"
                      >
                        — Sin registros de baños/instalaciones —
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- ====== ATS TOGGLES ====== -->
                <tr
                  v-for="(attr, atsIdx) in (segmento.attributes || []).filter(a => ['atsToggles', 'atsBloquesToggle', 'ATS BLOQUES TOGGLE'].includes(a.type))"
                  :key="'ats-toggle-' + index + '-' + atsIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="ats-print-wrap">
                      <template v-if="getAtsBlocksForPrint(attr).length">
                        <div
                          v-for="(block, bIdx) in getAtsBlocksForPrint(attr)"
                          :key="'ats-block-' + atsIdx + '-' + bIdx"
                          class="ats-block"
                        >
                          <div class="ats-block-title">
                            {{ block.title || `Bloque ${bIdx + 1}` }}
                          </div>
                          <table class="data-table ats-print-table">
                            <thead>
                              <tr>
                                <th class="ats-num-col">
                                  N°
                                </th>
                                <th class="ats-item-col">
                                  Ítem
                                </th>
                                <th class="ats-tick-col">
                                  Tick
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(item, iIdx) in block.items"
                                :key="'ats-item-' + atsIdx + '-' + bIdx + '-' + iIdx"
                              >
                                <td class="ats-num-col">
                                  {{ item.numero || (iIdx + 1) }}
                                </td>
                                <td class="ats-item-col">
                                  {{ item.label || '—' }}
                                </td>
                                <td class="ats-tick-col">
                                  {{ getAtsTickLabel(item.tick) }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </template>
                      <div
                        v-else
                        class="value-cell"
                        style="text-align:center;"
                      >
                        — Sin bloques ATS —
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- ====== ATS TAREA ====== -->
                <tr
                  v-for="(attr, tareaIdx) in (segmento.attributes || []).filter(a => ['tarea', 'tareaAts', 'TAREA ATS'].includes(a.type))"
                  :key="'ats-tarea-' + index + '-' + tareaIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="ats-print-wrap">
                      <template v-if="getAtsTareaRowsForPrint(attr).length">
                        <table class="data-table ats-task-table">
                          <thead>
                            <tr>
                              <th class="ats-task-etapa-col">
                                Tarea o Etapas del Trabajo a Realizar
                              </th>
                              <th class="ats-task-peligro-col">
                                Peligro
                              </th>
                              <th class="ats-task-riesgo-col">
                                Riesgo (ver Tabla N°1)
                              </th>
                              <th class="ats-task-po-col">
                                P.O
                              </th>
                              <th class="ats-task-cp-col">
                                C.P
                              </th>
                              <th class="ats-task-pond-col">
                                Ponderación
                              </th>
                              <th class="ats-task-medidas-col">
                                Medidas de Control Propuestas
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr
                              v-for="(row, rIdx) in getAtsTareaRowsForPrint(attr)"
                              :key="'ats-task-row-' + tareaIdx + '-' + rIdx"
                            >
                              <td class="ats-task-etapa-col">
                                {{ row.tareaEtapa || '—' }}
                              </td>
                              <td class="ats-task-peligro-col">
                                <template v-if="row.peligrosDetalle.length">
                                  <div
                                    v-for="(p, pIdx) in row.peligrosDetalle"
                                    :key="'ats-peligro-' + tareaIdx + '-' + rIdx + '-' + pIdx"
                                    class="ats-multi-block"
                                  >
                                    {{ p.peligro || '—' }}
                                  </div>
                                </template>
                                <template v-else>
                                  {{ row.peligro || '—' }}
                                </template>
                              </td>
                              <td class="ats-task-riesgo-col">
                                <template v-if="row.peligrosDetalle.length">
                                  <div
                                    v-for="(p, pIdx) in row.peligrosDetalle"
                                    :key="'ats-riesgo-wrap-' + tareaIdx + '-' + rIdx + '-' + pIdx"
                                    class="ats-multi-block"
                                  >
                                    <template v-if="p.riesgos.length">
                                      <div
                                        v-for="(r, rrIdx) in p.riesgos"
                                        :key="'ats-riesgo-' + tareaIdx + '-' + rIdx + '-' + pIdx + '-' + rrIdx"
                                      >
                                        {{ rrIdx + 1 }}. {{ r }}
                                      </div>
                                    </template>
                                    <template v-else>
                                      —
                                    </template>
                                  </div>
                                </template>
                                <template v-else>
                                  {{ row.riesgo || '—' }}
                                </template>
                              </td>
                              <td class="ats-task-po-col">
                                {{ row.po || '—' }}
                              </td>
                              <td class="ats-task-cp-col">
                                {{ row.cp || '—' }}
                              </td>
                              <td class="ats-task-pond-col">
                                {{ row.ponderacion || '—' }}
                              </td>
                              <td class="ats-task-medidas-col">
                                {{ row.medidasControl || '—' }}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </template>
                      <div
                        v-else
                        class="value-cell"
                        style="text-align:center;"
                      >
                        — Sin registros de tareas ATS —
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- ====== CONDICIONES SEGURIDAD TRABAJO ====== -->
                <tr
                  v-for="(attr, csIdx) in (segmento.attributes || []).filter(a => isCondicionesSeguridadType(a.type))"
                  :key="'cond-seg-' + index + '-' + csIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="condseg-print-wrap">
                      <template v-for="(grp, gIdx) in getCondicionesSeguridadGroupsForPrint(attr)" :key="'cs-group-' + csIdx + '-' + gIdx">
                        <div class="condseg-group-title">
                          {{ grp.groupTitle || 'Condiciones de Seguridad' }}
                        </div>

                        <div
                          v-for="(block, bIdx) in grp.blocks"
                          :key="'cs-block-' + csIdx + '-' + gIdx + '-' + bIdx"
                          class="condseg-block"
                        >
                          <div v-if="block.sectionTitle" class="condseg-section-title">
                            {{ block.sectionTitle }}
                          </div>
                          <div class="condseg-block-title">
                            {{ block.title || `Bloque ${bIdx + 1}` }}
                            <span class="condseg-apply-chip">{{ block.aplicaLabel }}</span>
                          </div>
                          <div v-if="block.infoText" class="condseg-info-text">
                            {{ block.infoText }}
                          </div>

                          <table class="data-table condseg-print-table">
                            <thead>
                              <tr>
                                <th class="condseg-code-col">Item</th>
                                <th class="condseg-item-col">Descripción</th>
                                <th class="condseg-state-col">Estado</th>
                                <th class="condseg-sev-col">Severidad</th>
                                <th class="condseg-obs-col">Observación</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr
                                v-for="(item, iIdx) in block.items"
                                :key="'cs-item-' + csIdx + '-' + gIdx + '-' + bIdx + '-' + iIdx"
                              >
                                <td class="condseg-code-col">{{ item.codigo || (iIdx + 1) }}</td>
                                <td class="condseg-item-col">{{ item.label || '—' }}</td>
                                <td class="condseg-state-col">{{ item.estado || '—' }}</td>
                                <td class="condseg-sev-col">{{ item.severidad || '—' }}</td>
                                <td class="condseg-obs-col">{{ item.observacion || '—' }}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <!-- Evidencia de Desviación (usr1) -->
                        <div v-if="attr.fotosHallazgo && attr.fotosHallazgo.length > 0" style="margin-top: 12px; border: 1px solid #cbd5e1; border-radius: 4px; padding: 8px;">
                          <div style="font-weight: bold; color: #475569; margin-bottom: 8px;">Evidencia Fotográfica Desviaciones</div>
                          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            <div v-for="(img, idx) in attr.fotosHallazgo" :key="'img-hall-cs-' + idx" style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px; background: #fff;">
                              <img :src="resolveImgSrc(img)" style="width: 150px; height: 110px; object-fit: cover; border-radius: 2px; display: block;" alt="Foto Desviación">
                            </div>
                          </div>
                        </div>

                        <!-- Bloque de Cierre de Desviación (usr2 o In Situ) -->
                        <div v-if="attr.cerrarInSitu === 'NO' || attr.cerrarInSitu === 'SI'" style="margin-top: 12px; border: 2px solid #8b5cf6; border-radius: 4px; padding: 12px; background-color: #faf5ff;">
                          <div style="font-weight: bold; color: #6d28d9; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 4px;">Cierre de Desviaciones / Hallazgos</div>
                          <table style="width: 100%; border-collapse: collapse;">
                            <tbody>
                              <tr>
                                <td style="width: 30%; font-weight: bold; padding: 4px 0;">Superior Asignado:</td>
                                <td style="padding: 4px 0;">{{ getNombreSuperiorAsignado() }}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: bold; padding: 4px 0;">Fecha Compromiso:</td>
                                <td style="padding: 4px 0;">{{ attr.fechaCompromiso || '—' }}</td>
                              </tr>
                              <tr>
                                <td style="font-weight: bold; padding: 4px 0;">Comentarios de Cierre:</td>
                                <td style="padding: 4px 0; white-space: pre-wrap;">{{ attr.comentariosCierre || '—' }}</td>
                              </tr>
                              <tr v-if="attr.fotosCierre && attr.fotosCierre.length > 0">
                                <td style="font-weight: bold; padding: 4px 0;">Fotos Cierre (Evidencia):</td>
                                <td style="padding: 4px 0;">
                                  <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                                    <div v-for="(img, idx) in attr.fotosCierre" :key="'img-cier-cs-' + idx" style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 4px; background: #fff;">
                                      <img :src="resolveImgSrc(img)" style="width: 150px; height: 110px; object-fit: cover; border-radius: 2px; display: block;" alt="Foto Cierre">
                                    </div>
                                  </div>
                                </td>
                              </tr>
                              <tr v-if="attr.gpsCierre && attr.gpsCierre.lat">
                                <td style="font-weight: bold; padding: 4px 0;">Ubicación Cierre GPS:</td>
                                <td style="padding: 4px 0;">
                                  <div class="mb-1"><strong>Latitud:</strong> {{ attr.gpsCierre.lat }} | <strong>Longitud:</strong> {{ attr.gpsCierre.lng }}</div>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </template>
                    </div>
                  </td>
                </tr>
                <!-- ====== CHECKLISTS SEMANALES STANDARD (ALZA HOMBRE, GRUA HORQUILLA, CAMIONETA, CAMIONES) ====== -->
                <tr
                  v-for="(attr, weeklyIdx) in (segmento.attributes || []).filter(a => getWeeklyChecklistConfig(a.type))"
                  :key="'weekly-' + index + '-' + weeklyIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="weekly-wrap">
                      <!-- Datos (Patente / Próxima Mantención) -->
                      <table class="data-table weekly-info-table">
                        <tbody>
                          <tr>
                            <td class="label-cell" style="width: 25%;">Patente / Equipo:</td>
                            <td class="value-cell" style="width: 25%;">{{ attr.datos?.patente || '—' }}</td>
                            <td class="label-cell" style="width: 25%;">Próxima Mantención:</td>
                            <td class="value-cell" style="width: 25%;">{{ formatDate(attr.datos?.proximaMantencion) || attr.datos?.proximaMantencion || '—' }}</td>
                          </tr>
                        </tbody>
                      </table>

                      <!-- Tabla principal de Inspección Semanal -->
                      <table class="data-table weekly-table">
                        <colgroup>
                          <col style="width: 44%;">
                          <col style="width: 8%;" v-for="d in getWeeklyChecklistConfig(attr.type).days" :key="'col-' + d.key">
                        </colgroup>
                        <thead>
                          <tr>
                            <th class="weekly-head-left" rowspan="2">
                              ESTRUCTURA / COMPONENTES / SISTEMAS
                            </th>
                            <th class="weekly-day-head" colspan="7">
                              DIAS DE LA SEMANA
                            </th>
                          </tr>
                          <tr>
                            <th v-for="d in getWeeklyChecklistConfig(attr.type).days" :key="'h-day-' + d.key" class="weekly-day-cell">
                              {{ d.short }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <!-- Fila de Fechas -->
                          <tr class="weekly-meta-row">
                            <td class="weekly-meta-label">
                              FECHA
                            </td>
                            <td v-for="d in getWeeklyChecklistConfig(attr.type).days" :key="'date-' + d.key" class="weekly-meta-value">
                              {{ formatDate(attr.fechas?.[d.key]) || '—' }}
                            </td>
                          </tr>
                          <!-- Fila de Kilometraje si aplica -->
                          <tr v-if="getWeeklyChecklistConfig(attr.type).metrics.includes('kilometraje')" class="weekly-meta-row">
                            <td class="weekly-meta-label">
                              KILOMETRAJE
                            </td>
                            <td v-for="d in getWeeklyChecklistConfig(attr.type).days" :key="'kil-' + d.key" class="weekly-meta-value">
                              {{ attr.mediciones?.[d.key]?.kilometraje || '—' }}
                            </td>
                          </tr>
                          <!-- Fila de Horómetro si aplica -->
                          <tr v-if="getWeeklyChecklistConfig(attr.type).metrics.includes('horometro')" class="weekly-meta-row">
                            <td class="weekly-meta-label">
                              HOROMETRO
                            </td>
                            <td v-for="d in getWeeklyChecklistConfig(attr.type).days" :key="'hor-' + d.key" class="weekly-meta-value">
                              {{ attr.mediciones?.[d.key]?.horometro || '—' }}
                            </td>
                          </tr>

                          <!-- Items agrupados -->
                          <template v-for="grp in getWeeklyChecklistConfig(attr.type).groups" :key="'grp-' + grp.key">
                            <!-- Fila de Sección -->
                            <tr>
                              <td colspan="8" class="weekly-section-title-cell">
                                {{ grp.title }} ({{ grp.mode === 'bm' ? 'B = BUENO, M = MALO' : 'SI / NO' }})
                              </td>
                            </tr>
                            <!-- Filas de Items -->
                            <tr v-for="item in grp.items" :key="'item-' + item.key">
                              <td class="weekly-item-label-cell">
                                {{ item.code }} {{ item.label }}
                              </td>
                              <td v-for="d in getWeeklyChecklistConfig(attr.type).days" :key="'val-' + item.key + '-' + d.key" class="weekly-item-val-cell" :class="getWeeklyValClass(attr.respuestas?.[item.key]?.[d.key])">
                                {{ (attr.respuestas?.[item.key]?.[d.key] || '').toUpperCase() || '—' }}
                              </td>
                            </tr>
                          </template>
                        </tbody>
                      </table>

                      <!-- Sección de Observaciones y Daños -->
                      <table class="data-table weekly-obs-table" style="margin-top: 10px;">
                        <tbody>
                          <tr>
                            <td class="label-cell" style="width: 25%;">Observaciones y/o Daños:</td>
                            <td class="value-cell" style="width: 75%; white-space: pre-wrap;">{{ attr.observacionesDanos || '—' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECKLIST ELEMENTOS DE VISIBILIDAD DMH ====== -->
                <tr
                  v-for="(attr, visIdx) in (segmento.attributes || []).filter(a => a.type === 'checkListElementosVisibilidadDmh')"
                  :key="'visib-' + index + '-' + visIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="weekly-wrap">
                      <!-- Rango de Fechas -->
                      <table class="data-table weekly-info-table">
                        <tbody>
                          <tr>
                            <td class="label-cell" style="width: 25%;">Inspección desde:</td>
                            <td class="value-cell" style="width: 25%;">{{ formatDate(attr.fechaInicio) || '—' }}</td>
                            <td class="label-cell" style="width: 25%;">Inspección hasta:</td>
                            <td class="value-cell" style="width: 25%;">{{ formatDate(attr.fechaTermino) || '—' }}</td>
                          </tr>
                        </tbody>
                      </table>

                      <!-- Tabla Principal Elementos Visibilidad -->
                      <table class="data-table weekly-table">
                        <colgroup>
                          <col style="width: 44%;">
                          <col style="width: 8%;" v-for="d in alzaHombreDays" :key="'col-' + d.key">
                        </colgroup>
                        <thead>
                          <tr>
                            <th class="weekly-head-left" rowspan="2">
                              ELEMENTOS DE VISIBILIDAD - COMPONENTES
                            </th>
                            <th class="weekly-day-head" colspan="7">
                              DIAS DE LA SEMANA
                            </th>
                          </tr>
                          <tr>
                            <th v-for="d in alzaHombreDays" :key="'h-day-' + d.key" class="weekly-day-cell">
                              {{ d.short }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <!-- Fila de Fechas calculadas -->
                          <tr class="weekly-meta-row">
                            <td class="weekly-meta-label">FECHA</td>
                            <td v-for="(d, dIdx) in alzaHombreDays" :key="'date-' + d.key" class="weekly-meta-value">
                              {{ formatDate(addDaysIso(attr.fechaInicio, dIdx)) || '—' }}
                            </td>
                          </tr>

                          <!-- Iterar sobre los grupos de visibilidad -->
                          <template v-for="grp in visibilidadGroups" :key="'grp-' + grp.id">
                            <tr>
                              <td colspan="8" class="weekly-section-title-cell">
                                {{ grp.title }} ({{ grp.stateType === 'bm' ? 'B = BUENO, M = MALO' : 'SI / NO' }})
                              </td>
                            </tr>
                            <tr v-for="item in grp.items" :key="'item-' + item.id">
                              <td class="weekly-item-label-cell">
                                {{ item.numero }}. {{ item.label }}
                              </td>
                              <td v-for="d in alzaHombreDays" :key="'val-' + item.id + '-' + d.key" class="weekly-item-val-cell" :class="getWeeklyValClass(attr.items?.find(it => Number(it.numero) === item.numero)?.days?.[d.key])">
                                {{ (attr.items?.find(it => Number(it.numero) === item.numero)?.days?.[d.key] || '').toUpperCase() || '—' }}
                              </td>
                            </tr>
                          </template>

                          <!-- Fila de Observaciones Diarias -->
                          <tr class="weekly-meta-row">
                            <td class="weekly-meta-label">OBSERVACIONES DIARIAS</td>
                            <td v-for="d in alzaHombreDays" :key="'obs-' + d.key" class="weekly-meta-value" style="font-size: 9px; line-height: 1.1; max-width: 60px; word-wrap: break-word;">
                              {{ attr.observaciones?.[d.key] || '—' }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== CHECKLIST EXTINTOR / GRILLETE / RETRACTIL CDCH ====== -->
                <tr
                  v-for="(attr, cdchIdx) in (segmento.attributes || []).filter(a => getCdchConfig(a.type))"
                  :key="'cdch-' + index + '-' + cdchIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="weekly-wrap">
                      <!-- Datos de identificación y descripción del equipo -->
                      <table class="data-table weekly-info-table">
                        <tbody>
                          <tr>
                            <td class="label-cell" style="width: 20%;">Lugar:</td>
                            <td class="value-cell" style="width: 30%;">{{ attr.identificacion?.lugar || '—' }}</td>
                            <td class="label-cell" style="width: 20%;">Color del Mes:</td>
                            <td class="value-cell" style="width: 30%;">{{ attr.identificacion?.colorMes || '—' }}</td>
                          </tr>
                          <tr>
                            <td class="label-cell">Fecha Inspección:</td>
                            <td class="value-cell">{{ formatDate(attr.identificacion?.fechaInspeccion) || '—' }}</td>
                            <td class="label-cell">Fecha Término:</td>
                            <td class="value-cell">{{ formatDate(attr.identificacion?.fechaTermino) || '—' }}</td>
                          </tr>
                          <tr>
                            <template v-for="field in getCdchConfig(attr.type).descripcionFields" :key="'field-' + field.key">
                              <td class="label-cell">{{ field.label }}:</td>
                              <td class="value-cell">{{ attr.descripcionEquipo?.[field.key] || '—' }}</td>
                            </template>
                          </tr>
                        </tbody>
                      </table>

                      <!-- Tabla Principal CDCH -->
                      <table class="data-table weekly-table">
                        <colgroup>
                          <col style="width: 34%;">
                          <col style="width: 7%;" v-for="d in cdchDays" :key="'col-' + d.key">
                          <col style="width: 17%;">
                        </colgroup>
                        <thead>
                          <tr>
                            <th class="weekly-head-left" rowspan="2">
                              {{ getCdchConfig(attr.type).title.toUpperCase() }} - COMPONENTES
                            </th>
                            <th class="weekly-day-head" colspan="7">
                              DIAS DE LA SEMANA
                            </th>
                            <th class="weekly-head-left" rowspan="2" style="text-align: center;">
                              MEDIDAS CORRECTIVAS
                            </th>
                          </tr>
                          <tr>
                            <th v-for="d in cdchDays" :key="'h-day-' + d.key" class="weekly-day-cell">
                              {{ d.short }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <!-- Fila de Fechas calculadas -->
                          <tr class="weekly-meta-row">
                            <td class="weekly-meta-label">FECHA</td>
                            <td v-for="(d, dIdx) in cdchDays" :key="'date-' + d.key" class="weekly-meta-value">
                              {{ formatDate(addDaysIso(attr.identificacion?.fechaInspeccion, dIdx)) || '—' }}
                            </td>
                            <td class="weekly-meta-value">&nbsp;</td>
                          </tr>

                          <!-- Filas de Items -->
                          <tr v-for="item in getCdchConfig(attr.type).items" :key="'item-' + item.numero">
                            <td class="weekly-item-label-cell">
                              {{ item.numero }}. {{ item.label }}
                            </td>
                            <td v-for="d in cdchDays" :key="'val-' + item.numero + '-' + d.key" class="weekly-item-val-cell" :class="getWeeklyValClass(attr.componentes?.find(c => Number(c.numero) === item.numero)?.days?.[d.key])">
                              {{ (attr.componentes?.find(c => Number(c.numero) === item.numero)?.days?.[d.key] || '').toUpperCase() || '—' }}
                            </td>
                            <td class="weekly-item-label-cell" style="font-size: 10px; font-weight: normal;">
                              {{ attr.componentes?.find(c => Number(c.numero) === item.numero)?.medidaCorrectiva || '—' }}
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <!-- Observaciones CDCH -->
                      <table class="data-table weekly-obs-table" style="margin-top: 10px;">
                        <tbody>
                          <tr>
                            <td class="label-cell" style="width: 25%;">Observaciones:</td>
                            <td class="value-cell" style="width: 75%; white-space: pre-wrap;">{{ attr.observaciones || '—' }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== FALLBACK: atributos sin renderer específico ====== -->
                <tr
                  v-for="(attr, fbIdx) in (segmento.attributes || []).filter(isUnhandledPrintableAttr)"
                  :key="'fallback-' + index + '-' + fbIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="em-wrap">
                      <div class="em-title">
                        {{ attr.label || attr.type }}
                      </div>
                      <table
                        class="data-table em-table"
                        style="margin-top: 8px;"
                      >
                        <thead>
                          <tr>
                            <th
                              v-for="h in getGenericHeaders(attr)"
                              :key="'fb-h-' + fbIdx + '-' + h"
                              class="label-cell-header"
                            >
                              {{ h }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr
                            v-for="(row, rIdx) in getGenericRows(attr)"
                            :key="'fb-r-' + fbIdx + '-' + rIdx"
                          >
                            <td
                              v-for="h in getGenericHeaders(attr)"
                              :key="'fb-c-' + fbIdx + '-' + rIdx + '-' + h"
                              class="value-cell"
                            >
                              <template v-if="isPhotoArray(row?.[h])">
                                <div class="mc-img-wrap">
                                  <img
                                    v-for="(foto, fIdx) in row[h]"
                                    :key="'fb-f-' + fbIdx + '-' + rIdx + '-' + h + '-' + fIdx"
                                    :src="resolveImgSrc(foto)"
                                    class="mc-img"
                                  >
                                </div>
                              </template>
                              <template v-else>
                                {{ formatGenericCell(row?.[h]) }}
                              </template>
                            </td>
                          </tr>
                          <tr v-if="!getGenericRows(attr).length">
                            <td
                              class="value-cell"
                              :colspan="Math.max(1, getGenericHeaders(attr).length)"
                              style="text-align:center;"
                            >
                              — Sin registros —
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== MATRIZ OBS Y RECOMENDACIONES ====== -->
                <tr
                  v-for="(attr, morIdx) in (segmento.attributes || []).filter(a => a.type === 'matrizMAObsyRecomenaciones')"
                  :key="'mor-' + index + '-' + morIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <table
                      class="data-table tabla-uniforme"
                      style="margin-top: 12px;"
                    >
                      <thead>
                        <tr>
                          <th style="text-align:center; width:40%;">
                            Observación
                          </th>
                          <th style="text-align:center; width:40%;">
                            Recomendación
                          </th>
                          <th style="text-align:center; width:20%;">
                            Fotos
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(row, rIdx) in getObsRecRows(attr)"
                          :key="'mor-row-' + morIdx + '-' + rIdx"
                        >
                          <td style="text-align:left;">
                            {{ getObsRecText(row, 'observacion') || '—' }}
                          </td>
                          <td style="text-align:left;">
                            {{ getObsRecText(row, 'recomendacion') || '—' }}
                          </td>
                          <td style="text-align:center;">
                            <div
                              v-if="getObsRecPhotos(row).length"
                              class="mc-img-wrap"
                            >
                              <img
                                v-for="(foto, fIdx) in getObsRecPhotos(row)"
                                :key="'mor-foto-' + morIdx + '-' + rIdx + '-' + fIdx"
                                :src="resolveImgSrc(foto)"
                                class="mc-img"
                              >
                            </div>
                            <span v-else>—</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>

                <!-- ====== MATRICES (todas las tipo tabla) ====== -->
                <template
                  v-for="(attr, i) in (segmento.attributes || [])"
                  :key="'seg-'+index+'-any-matrix-'+i"
                >
                  <table
                    v-if="isMatrixLike(attr)"
                    :class="['data-table', { 'tabla-uniforme': attr.type !== 'matrizCheck' }]"
                    style="margin-top: 12px;"
                  >
                    <thead>
                      <tr
                        v-for="(hdrRow, rIdx) in (attr.headers ?? [])"
                        :key="'hdr-' + rIdx"
                      >
                        <th
                          v-for="(cell, cIdx) in hdrRow"
                          :key="'hdr-cell-' + rIdx + '-' + cIdx"
                          :rowspan="cell.rowspan ?? 1"
                          :colspan="cell.colspan ?? 1"
                          :style="{
                            textAlign: 'center',
                            verticalAlign: 'middle',
                            fontWeight: '600',
                            width: getColumnWidth(attr, cIdx, rIdx, cell)
                          }"
                        >
                          {{ cell.label ?? '' }}
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr
                        v-for="(row, rIdx) in (attr.body ?? [])"
                        :key="'row-' + rIdx"
                      >
                        <td
                          v-for="(cell, cIdx) in row"
                          :key="'cell-' + rIdx + '-' + cIdx"
                          :style="{ textAlign: cellAlignPrint(cell) }"
                        >
                          <!-- matrizCheck: check -->
                          <template v-if="attr.type === 'matrizCheck' && cell?.type === 'check'">
                            {{ mapCheckLabel(cell.value, getMCheckOptions(attr)) }}
                          </template>

                          <!-- matrizCheck: image -->
                          <template v-else-if="attr.type === 'matrizCheck' && cell?.type === 'image'">
                            <div
                              v-if="(cell.galeria || []).length"
                              class="mc-img-wrap"
                            >
                              <img
                                v-for="(img, k) in cell.galeria"
                                :key="k"
                                :src="resolveImgSrc(img)"
                                class="mc-img"
                              >
                            </div>

                            <!-- 👇 ESTE ES EL CASO DE TU SCREENSHOT (value trae filename) -->
                            <img
                              v-else-if="resolveImgSrc(cell.value)"
                              :src="resolveImgSrc(cell.value)"
                              class="mc-img"
                            >

                            <span v-else>—</span>
                          </template>

                          <!-- default -->
                          <template v-else>
                            {{ cell?.value ?? '' }}
                          </template>
                        </td>
                      </tr>
                    </tbody>

                    <!-- FOOTER -->
                    <tfoot v-if="attr.footer && attr.footer.length">
                      <!-- Caso 2D (igual que tu 'matriz' original, soporta cal:'prom') -->
                      <template v-if="isFooter2D(attr.footer)">
                        <tr
                          v-for="(footRow, frIdx) in attr.footer"
                          :key="'ftr-' + frIdx"
                        >
                          <td
                            v-for="(cell, fcIdx) in footRow"
                            :key="'ftr-cell-' + frIdx + '-' + fcIdx"
                            :rowspan="cell.rowspan ?? 1"
                            :colspan="cell.colspan ?? 1"
                            style="text-align:center; vertical-align:middle; font-weight:600;"
                          >
                            <template v-if="cell.cal === 'prom'">
                              {{ getAverageByPromCell(attr, frIdx, fcIdx) }}
                            </template>
                            <template v-else>
                              {{ (cell.label ?? cell.value) ?? '' }}
                            </template>
                          </td>
                        </tr>
                      </template>

                      <!-- Caso 1D (p.ej. matrizTransp) -->
                      <template v-else>
                        <tr
                          v-for="(f, idxf) in attr.footer"
                          :key="'ftr1d-' + idxf"
                        >
                          <!-- ✅ Fix alineación MatrizCheck: Label izquierda, Valor bajo 'Puntaje', Resto vacío -->
                          <template v-if="attr.type === 'matrizCheck' && getPuntajeColIndexForFooter(attr) > -1">
                            <!-- Label (si hay espacio antes del puntaje) -->
                            <td
                              v-if="getPuntajeColIndexForFooter(attr) > 0"
                              :colspan="getPuntajeColIndexForFooter(attr)"
                              style="text-align:right; font-weight:600;"
                            >
                              {{ f.label ?? 'TOTAL' }}
                            </td>
                            <!-- Valor (en la columna puntaje) -->
                            <td style="text-align:center; font-weight:600;">
                              {{ f.value ?? '' }}
                            </td>
                            <!-- Espacio vacío (si hay columnas después) -->
                            <td
                              v-if="((attr.headers?.[0]?.length || 0) - 1 - getPuntajeColIndexForFooter(attr)) > 0"
                              :colspan="(attr.headers?.[0]?.length || 0) - 1 - getPuntajeColIndexForFooter(attr)"
                            />
                          </template>

                          <!-- Default logic -->
                          <template v-else>
                            <!-- Label -->
                            <td
                              :colspan="(attr.headers?.[0]?.length || 2) - 1"
                              style="text-align:right; font-weight:600;"
                            >
                              {{ f.label ?? 'TOTAL' }}
                            </td>
                            <!-- Valor -->
                            <td style="text-align:center; font-weight:600;">
                              {{ f.value ?? '' }}
                            </td>
                          </template>
                        </tr>
                      </template>
                    </tfoot>
                  </table>

                  <!-- 🔹 Gráfico (si aplica) -->
                  <div
                    v-if="attr.grafico"
                    :id="chartId(segmento.posicion, i)"
                    style="height:320px; margin:8px 0;"
                  />
                </template>

                <!-- ====== ESTRUCTURA MULTIPLE ====== -->
                <tr
                  v-for="(attr, emIdx) in (segmento.attributes || []).filter(a => a.type === 'resgistroAdd')"
                  :key="'em-' + index + '-' + emIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div class="em-wrap">
                      <div class="em-title">
                        {{ attr.label || 'Estructuras' }}
                      </div>

                      <table class="data-table em-table">
                        <thead>
                          <tr>
                            <th
                              class="label-cell-header"
                              style="width:35%;"
                            >
                              Item
                            </th>
                            <th
                              class="label-cell-header"
                              style="width:10%;"
                            >
                              Nmro
                            </th>
                            <th
                              class="label-cell-header"
                              style="width:15%;"
                            >
                              Condiciones
                            </th>
                            <th
                              class="label-cell-header"
                              style="width:40%;"
                            >
                              Observación
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          <template v-if="(attr.body || []).length">
                            <tr
                              v-for="(row, rIdx) in attr.body"
                              :key="'em-row-' + emIdx + '-' + rIdx"
                            >
                              <td class="value-cell">
                                {{ emItemNombre(attr, row) }}
                              </td>

                              <td
                                class="value-cell"
                                style="text-align:center;"
                              >
                                {{ row?.nmro ?? '—' }}
                              </td>

                              <td
                                class="value-cell"
                                style="text-align:center;"
                              >
                                {{ row?.condiciones ?? '—' }}
                              </td>

                              <td class="value-cell">
                                <div>{{ row?.observacion ?? '—' }}</div>

                                <!-- fotos -->
                                <div
                                  v-if="(row?.galeria || []).length"
                                  class="photo-container"
                                  style="margin-top:6px;"
                                >
                                  <img
                                    v-for="(foto, fIdx) in row.galeria"
                                    :key="'em-foto-' + rIdx + '-' + fIdx"
                                    :src="resolveImgSrc(foto)"
                                    class="photo-img"
                                    style="width: 120px; height: 90px; object-fit: cover;"
                                  >
                                </div>

                                <!-- obs de la foto -->
                                <div
                                  v-if="row?.fotoObs"
                                  style="margin-top:4px;"
                                >
                                  <strong>Obs foto:</strong> {{ row.fotoObs }}
                                </div>
                              </td>
                            </tr>
                          </template>

                          <tr v-else>
                            <td
                              class="value-cell"
                              colspan="4"
                              style="text-align:center;"
                            >
                              — Sin registros —
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>

                <!-- ====== REGISTRO EVENTOS (Antecedentes Complementarios) ====== -->
                <tr
                  v-for="(attr, evIdx) in (segmento.attributes || []).filter(a => a.type === 'registroEventos')"
                  :key="'ev-' + index + '-' + evIdx"
                >
                  <td
                    colspan="4"
                    style="padding:0;"
                  >
                    <div
                      class="em-wrap"
                      style="margin-top: 15px;"
                    >
                      <div
                        class="em-title"
                        style="background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1;"
                      >
                        {{ attr.label || 'Eventos' }}
                      </div>

                      <table
                        class="data-table em-table"
                        style="width: 100%;"
                      >
                        <thead>
                          <tr>
                            <th
                              class="label-cell-header"
                              style="width:25%;"
                            >
                              Comentario Inicial / Hora
                            </th>
                            <th
                              class="label-cell-header"
                              style="width:30%;"
                            >
                              Observaciones
                            </th>
                            <th
                              class="label-cell-header"
                              style="width:25%;"
                            >
                              Fotos (+Obs)
                            </th>
                            <th
                              class="label-cell-header"
                              style="width:20%;"
                            >
                              Documentos (+Obs)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <template v-if="(attr.body || []).length">
                            <tr
                              v-for="(ev, eIdx) in attr.body"
                              :key="'ev-row-' + evIdx + '-' + eIdx"
                            >
                              <!-- Col 1: Comentario Inicial + Hora -->
                              <td
                                class="value-cell"
                                style="vertical-align: top;"
                              >
                                <div style="font-weight: 600; margin-bottom: 4px;">
                                  {{ ev.comentarioInicial }}
                                </div>
                                <div
                                  style="font-size: 0.85em; background: #e2e8f0; display: inline-block; padding: 2px 6px; border-radius: 4px;"
                                >
                                  Hora: {{ ev.hora || '—' }}
                                </div>
                              </td>

                              <!-- Col 2: Observaciones principales -->
                              <td
                                class="value-cell"
                                style="vertical-align: top;"
                              >
                                <div style="white-space: pre-wrap;">
                                  {{ ev.observaciones || '—' }}
                                </div>
                              </td>

                              <!-- Col 3: Fotos y su observación -->
                              <td
                                class="value-cell"
                                style="vertical-align: top;"
                              >
                                <div
                                  v-if="ev.fotoObs"
                                  style="font-style: italic; margin-bottom: 6px; font-size: 0.9em; color: #475569;"
                                >
                                  Obs: {{ ev.fotoObs }}
                                </div>
                                <div
                                  v-if="(ev.galeria || []).length"
                                  class="photo-container"
                                >
                                  <img
                                    v-for="(foto, fis) in ev.galeria"
                                    :key="'ev-foto-' + eIdx + '-' + fis"
                                    :src="resolveImgSrc(foto)"
                                    class="photo-img"
                                    style="width: 80px; height: 80px; object-fit: cover; border: 1px solid #ddd; margin: 2px;"
                                  >
                                </div>
                                <div
                                  v-else
                                  style="color: #94a3b8; font-size: 0.85em;"
                                >
                                  Sin fotos
                                </div>
                              </td>

                              <!-- Col 4: Documentos y su observación -->
                              <td
                                class="value-cell"
                                style="vertical-align: top;"
                              >
                                <div
                                  v-if="ev.docsObs"
                                  style="font-style: italic; margin-bottom: 6px; font-size: 0.9em; color: #475569;"
                                >
                                  Obs: {{ ev.docsObs }}
                                </div>
                                <div v-if="(ev.documentos || []).length">
                                  <div
                                    v-for="(doc, dis) in ev.documentos"
                                    :key="'ev-doc-' + eIdx + '-' + dis"
                                    style="margin-bottom: 4px;"
                                  >
                                    <a
                                      :href="doc.url"
                                      target="_blank"
                                      style="font-size: 0.85em; text-decoration: underline; color: #2563eb; display: flex; align-items: center;"
                                    >
                                      📄 {{ doc.name || doc.nombre || 'Adjunto' }}
                                    </a>
                                  </div>
                                </div>
                                <div
                                  v-else
                                  style="color: #94a3b8; font-size: 0.85em;"
                                >
                                  Sin docs
                                </div>
                              </td>
                            </tr>
                          </template>
                          <tr v-else>
                            <td
                              class="value-cell"
                              colspan="4"
                              style="text-align:center;"
                            >
                              — Sin eventos registrados —
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
      <br>
      <h2 class="titulo-firma">
        Flujo Aprobación / Firma Electrónica Simple
      </h2>
      <br>
      <!-- Estructura de firma actual del flujo -->
      <table
        v-if="false && estructuraFirmas.length"
        class="sign-table"
      >
        <thead>
          <tr>
            <th>Paso</th>
            <th>Rol</th>
            <th>Firmante asignado</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(st, idx) in estructuraFirmas"
            :key="'estructura-firma-' + idx"
          >
            <td>{{ st.orden }}</td>
            <td>{{ st.rol }}</td>
            <td>{{ st.firmante }}</td>
            <td>{{ st.estado }}</td>
          </tr>
        </tbody>
      </table>
      <div
        v-else-if="false"
        class="sign-observacion"
      >
        No hay estructura de flujo disponible para este survey.
      </div>

      <br>

      <!-- Estructura de firmas por paso (con placeholders si no está firmado) -->
      <table
        v-if="usarTablaFirmas && firmasDetallePorPaso.length"
        class="sign-table"
      >
        <thead>
          <tr>
            <th>Paso</th>
            <th>Rol</th>
            <th>Firmante asignado</th>
            <th>RUT / Nombre firma</th>
            <th>Fecha firma</th>
            <th>Método</th>
            <th>Código</th>
            <th>Estado</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(f, idx) in firmasDetalleFilasTabla"
            :key="'step-firma-' + idx"
          >
            <td>{{ f.orden || '-' }}</td>
            <td>{{ f.rol || '-' }}</td>
            <td>{{ f.es_firma_colectiva ? (f.integrante_actual?.nombre_user || f.firmante || '-') : (f.firmante || '-') }}</td>
            <td>
              <template v-if="f.es_firma_colectiva">
                {{ (f.integrante_actual?.nombre_user || '-') }}
              </template>
              <template v-else>
                {{ (f.rut || '-') + ' - ' + (f.nombre || '-') }}
              </template>
            </td>
            <td>{{ f.es_firma_colectiva ? (f.integrante_actual?.fecha_fes ? formatDate(f.integrante_actual?.fecha_fes) : '-') : (f.fecha || '-') }}</td>
            <td>{{ f.metodo_autenticacion || '-' }}</td>
            <td>{{ f.codigo || '-' }}</td>
            <td>
              <template v-if="f.es_firma_colectiva">
                <span v-if="f.integrante_actual?.estado_fes">APRUEBA OK</span>
                <span v-else>PENDIENTE</span>
              </template>
              <template v-else>
                <span v-if="f.aprueba_rechaza === 'APRUEBA'">APRUEBA OK</span>
                <span v-else-if="f.aprueba_rechaza === 'RECHAZA'">RECHAZA X</span>
                <span v-else>{{ formatEstadoFirma(f.aprueba_rechaza) }}</span>
              </template>
            </td>
            <td>
              <div
                v-if="!f.observaciones"
              >
                -
              </div>
              <div
                v-if="f.observaciones"
                class="sign-observacion"
              >
                <strong>Observación:</strong> {{ f.observaciones }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table
        v-else-if="firmasDetallePorPaso.length"
        class="sign-table"
      >
        <tbody>
          <tr
            v-for="(f, idx) in firmasDetallePorPaso"
            :key="'step-firma-card-' + idx"
          >
            <td class="sign-row">
              <div class="sign-grid">
                <div class="sign-item">
                  <strong>Paso:</strong> {{ f.orden || '-' }}
                </div>
                <div class="sign-item">
                  <strong>Rol:</strong> {{ f.rol || '-' }}
                </div>
                <div class="sign-item">
                  <strong>Firmante asignado:</strong> {{ f.firmante || '-' }}
                </div>
                <div class="sign-item sign-item-name">
                  <strong>RUT / Nombre:</strong> {{ (f.rut || '-') + ' - ' + (f.nombre || '-') }}
                </div>
                <div class="sign-item">
                  <strong>Fecha firma:</strong> {{ f.fecha || '-' }}
                </div>
                <div class="sign-item">
                  <strong>Método:</strong> {{ f.metodo_autenticacion || '-' }}
                </div>
                <div class="sign-item">
                  <strong>Código:</strong> {{ f.codigo || '-' }}
                </div>
                <div class="sign-item">
                  <strong>Estado:</strong>
                  <span v-if="f.aprueba_rechaza === 'APRUEBA'"> APRUEBA OK</span>
                  <span v-else-if="f.aprueba_rechaza === 'RECHAZA'"> RECHAZA X</span>
                  <span v-else> {{ formatEstadoFirma(f.aprueba_rechaza) }}</span>
                </div>
              </div>
              <div
                v-if="f.observaciones"
                class="sign-observacion"
              >
                <strong>Observación:</strong> {{ f.observaciones }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, onMounted, nextTick, computed, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useSurveyDetailStore } from "@/stores/surveyDetail";
import QRCode from 'qrcode'
import Highcharts from 'highcharts';
import axios from 'axios'
import apiAxios from '@/services/api.js'
import VerDoc from '@/components/VerDoc.vue'
import { getMockSurveys } from '@/data/mockSurveys'

const formatEstadoFirma = (val) => {
  if (!val) return '-';
  const clean = String(val).trim().toUpperCase();
  if (clean === 'APRUEBA' || clean === 'APROBADO' || clean === 'APRUEBA OK') return 'APRUEBA OK';
  if (clean === 'CON_OBSERVACIONES') return 'CON OBSERVACIONES';
  if (clean === 'RECHAZA' || clean === 'RECHAZADO') return 'RECHAZA X';
  return val;
}

const alzaHombreDays = [
  { key: 'miercoles', short: 'Mie' },
  { key: 'jueves', short: 'Jue' },
  { key: 'viernes', short: 'Vie' },
  { key: 'sabado', short: 'Sab' },
  { key: 'domingo', short: 'Dom' },
  { key: 'lunes', short: 'Lun' },
  { key: 'martes', short: 'Mar' }
];

const cdchDays = [
  { key: 'lunes', short: 'Lun' },
  { key: 'martes', short: 'Mar' },
  { key: 'miercoles', short: 'Mie' },
  { key: 'jueves', short: 'Jue' },
  { key: 'viernes', short: 'Vie' },
  { key: 'sabado', short: 'Sab' },
  { key: 'domingo', short: 'Dom' }
];

const alzaHombreGroups = [
  {
    key: 'documentos',
    title: 'Documentos',
    mode: 'sino',
    items: [
      { code: '1.1', label: 'Documentacion del Equipo (critico)', key: '1-1-documentacion-del-equipo-critico' }
    ]
  },
  {
    key: 'identificacion',
    title: 'Identificacion',
    mode: 'bm',
    items: [
      { code: '2.1', label: 'Logos y numero de identificacion', key: '2-1-logos-y-numero-de-identificacion' }
    ]
  },
  {
    key: 'ruedas',
    title: 'Sistemas de Seguridad Activa - Ruedas',
    mode: 'sino',
    items: [
      { code: '3.1', label: 'Desgaste de banda (critico)', key: '3-1-desgaste-de-banda-critico' },
      { code: '3.2', label: 'Corte lateral (critico)', key: '3-2-corte-lateral-critico' },
      { code: '3.3', label: 'Dibujo de neumatico', key: '3-3-dibujo-de-neumatico' },
      { code: '3.4', label: 'Seguro de Traba Tuercas de Ruedas (critico)', key: '3-4-seguro-de-traba-tuercas-de-ruedas-critico' }
    ]
  },
  {
    key: 'estabilidad',
    title: 'Estabilidad (ESP)',
    mode: 'bm',
    items: [
      { code: '4.1', label: 'Sensor de inclinacion y desnivel', key: '4-1-sensor-de-inclinacion-y-desnivel' }
    ]
  },
  {
    key: 'frenos',
    title: 'Frenos',
    mode: 'bm',
    items: [
      { code: '5.1', label: 'Mando de Frenado (critico)', key: '5-1-mando-de-frenado-critico' },
      { code: '5.2', label: 'Sistema de velocidad', key: '5-2-sistema-de-velocidad' }
    ]
  },
  {
    key: 'equipamientoSeguridad',
    title: 'Sistemas Complementarios - Equipamiento de Seguridad',
    mode: 'bm',
    items: [
      { code: '6.1', label: 'Triangulos', key: '6-1-triangulos' },
      { code: '6.2', label: 'Botiquin', key: '6-2-botiquin' },
      { code: '6.3', label: 'Extintor y tarjeta', key: '6-3-extintor-y-tarjeta' },
      { code: '6.4', label: 'Cunas (critico)', key: '6-4-cunas-critico' }
    ]
  },
  {
    key: 'equipoExterior',
    title: 'Equipo / Exterior',
    mode: 'bm',
    items: [
      { code: '7.1', label: 'Alarma de retroceso (critico)', key: '7-1-alarma-de-retroceso-critico' },
      { code: '7.2', label: 'Bocina (critico)', key: '7-2-bocina-critico' },
      { code: '7.3', label: 'Nivel de liquido refrigerante', key: '7-3-nivel-de-liquido-refrigerante' },
      { code: '7.4', label: 'Nivel de aceite', key: '7-4-nivel-de-aceite' },
      { code: '7.5', label: 'Parada de emergencia (critico)', key: '7-5-parada-de-emergencia-critico' },
      { code: '7.6', label: 'Estructura en general', key: '7-6-estructura-en-general' },
      { code: '7.7', label: 'Estado de Bateria', key: '7-7-estado-de-bateria' },
      { code: '7.8', label: 'Cables de conexion y cables electricos', key: '7-8-cables-de-conexion-y-cables-electricos' },
      { code: '7.9', label: 'Tubos hidraulicos, piezas de conexion', key: '7-9-tubos-hidraulicos-piezas-de-conexion' },
      { code: '7.10', label: 'Cilindros y Distribuidores', key: '7-10-cilindros-y-distribuidores' },
      { code: '7.11', label: 'Canerias, mangueras terminales y niples', key: '7-11-canerias-mangueras-terminales-y-niples' },
      { code: '7.12', label: 'Tanques hidraulicos y de combustible', key: '7-12-tanques-hidraulicos-y-de-combustible' },
      { code: '7.13', label: 'Baliza', key: '7-13-baliza' },
      { code: '7.14', label: 'Seguro de la Torreta', key: '7-14-seguro-de-la-torreta' },
      { code: '7.15', label: 'Rejilla de Piso', key: '7-15-rejilla-de-piso' },
      { code: '7.16', label: 'Perfiles de soporte en piso', key: '7-16-perfiles-de-soporte-en-piso' },
      { code: '7.17', label: 'Barandas laterales', key: '7-17-barandas-laterales' },
      { code: '7.18', label: 'Puerta o barandilla central de entrada a plataforma', key: '7-18-puerta-o-barandilla-central-de-entrada-a-plataforma' },
      { code: '7.19', label: 'Puntos de anclaje', key: '7-19-puntos-de-anclaje' },
      { code: '7.20', label: 'Panel de Control', key: '7-20-panel-de-control' },
      { code: '7.21', label: 'Levante y extension de brazos primarios y secundarios', key: '7-21-levante-y-extension-de-brazos-primarios-y-secundarios' },
      { code: '7.22', label: 'Bomba Auxiliar', key: '7-22-bomba-auxiliar' },
      { code: '7.23', label: 'Extension Pluma y Plumin', key: '7-23-extension-pluma-y-plumin' },
      { code: '7.24', label: 'Pastillas de friccion de la pluma', key: '7-24-pastillas-de-friccion-de-la-pluma' },
      { code: '7.25', label: 'Prueba de los ejes extensibles (AH 40 Mts.)', key: '7-25-prueba-de-los-ejes-extensibles-ah-40-mts' },
      { code: '7.26', label: 'Conmutador de Pedal', key: '7-26-conmutador-de-pedal' }
    ]
  },
  {
    key: 'direccion',
    title: 'Direccion',
    mode: 'bm',
    items: [
      { code: '8.1', label: 'Comprobacion de la direccion', key: '8-1-comprobacion-de-la-direccion' }
    ]
  }
];

const gruaHorquillaGroups = [
  { key: 'documentos', title: 'Documentos', mode: 'sino', items: [
    { code: '1.1', label: 'Documentacion del Equipo (critico)', key: '1-1-documentacion-del-equipo-critico' }
  ]},
  { key: 'identificacion', title: 'Identificacion', mode: 'bm', items: [
    { code: '2.1', label: 'Logos y numero de identificacion', key: '2-1-logos-y-numero-de-identificacion' }
  ]},
  { key: 'luces', title: 'Sistemas de Seguridad Activa - Luces', mode: 'bm', items: [
    { code: '3.1', label: 'Luces interiores', key: '3-1-luces-interiores' },
    { code: '3.3', label: 'Luces Intermitentes', key: '3-3-luces-intermitentes' },
    { code: '3.4', label: 'Luces Altas y bajas (critico)', key: '3-4-luces-altas-y-bajas-critico' },
    { code: '3.5', label: 'Luz de freno (critico)', key: '3-5-luz-de-freno-critico' },
    { code: '3.6', label: 'Estado de baliza', key: '3-6-estado-de-baliza' },
    { code: '3.7', label: 'Alarma de retroceso (critico)', key: '3-7-alarma-de-retroceso-critico' }
  ]},
  { key: 'neumaticos', title: 'Neumaticos', mode: 'sino', items: [
    { code: '4.1', label: 'Desgaste de banda (critico)', key: '4-1-desgaste-de-banda-critico' },
    { code: '4.2', label: 'Corte lateral (critico)', key: '4-2-corte-lateral-critico' },
    { code: '4.3', label: 'Dibujo de neumatico', key: '4-3-dibujo-de-neumatico' },
    { code: '4.4', label: 'Seguro de Traba Tuercas de Ruedas (critico)', key: '4-4-seguro-de-traba-tuercas-de-ruedas-critico' }
  ]},
  { key: 'esp', title: 'Estabilidad (ESP)', mode: 'sino', items: [
    { code: '5.1', label: 'Se advierte algun tipo de falla en sensor de tablero', key: '5-1-se-advierte-algun-tipo-de-falla-en-sensor-de-tablero' }
  ]},
  { key: 'frenos', title: 'Frenos', mode: 'bm', items: [
    { code: '6.1', label: 'Freno de mano (critico)', key: '6-1-freno-de-mano-critico' },
    { code: '6.2', label: 'Freno de pedal (critico)', key: '6-2-freno-de-pedal-critico' }
  ]},
  { key: 'cabina', title: 'Cabina', mode: 'bm', items: [
    { code: '7.1', label: 'Espejo retrovisor (critico)', key: '7-1-espejo-retrovisor-critico' },
    { code: '7.2', label: 'Estado de puertas', key: '7-2-estado-de-puertas' },
    { code: '7.3', label: 'Estado de manillas', key: '7-3-estado-de-manillas' },
    { code: '7.4', label: 'Estado de Chapa', key: '7-4-estado-de-chapa' },
    { code: '7.5', label: 'Estado de cadena torre', key: '7-5-estado-de-cadena-torre' },
    { code: '7.6', label: 'Estado de manguera', key: '7-6-estado-de-manguera' },
    { code: '7.7', label: 'Asientos', key: '7-7-asientos' },
    { code: '7.8', label: 'Bocina (critico)', key: '7-8-bocina-critico' },
    { code: '7.9', label: 'Aire acondicionado-calefaccion (critico)', key: '7-9-aire-acondicionado-calefaccion-critico' },
    { code: '7.10', label: 'Alza vidrio', key: '7-10-alza-vidrio' },
    { code: '7.11', label: 'Camara de Retroceso (critico)', key: '7-11-camara-de-retroceso-critico' },
    { code: '7.12', label: 'Mando de Operacion', key: '7-12-mando-de-operacion' },
    { code: '7.13', label: 'Escalera de acceso, peldanos', key: '7-13-escalera-de-acceso-peldanos' }
  ]},
  { key: 'seguridadPasiva', title: 'Sistemas de Seguridad Pasiva - Cabina', mode: 'bm', items: [
    { code: '8.1', label: 'Cinturon de seguridad (critico)', key: '8-1-cinturon-de-seguridad-critico' },
    { code: '8.2', label: 'Parabrisas (critico)', key: '8-2-parabrisas-critico' },
    { code: '8.3', label: 'Asiento (apoyacabezas)', key: '8-3-asiento-apoyacabezas' }
  ]},
  { key: 'equipamientoSeguridad', title: 'Sistemas Complementarios - Equipamiento de Seguridad', mode: 'bm', items: [
    { code: '10.1', label: 'Triangulos', key: '10-1-triangulos' },
    { code: '10.2', label: 'Llave Rueda', key: '10-2-llave-rueda' },
    { code: '10.3', label: 'Botiquin', key: '10-3-botiquin' },
    { code: '10.4', label: 'Extintor y tarjeta', key: '10-4-extintor-y-tarjeta' },
    { code: '10.5', label: 'Cunas (critico)', key: '10-5-cunas-critico' }
  ]},
  { key: 'equipoExterior', title: 'Equipo / Exterior', mode: 'bm', items: [
    { code: '11.1', label: 'Engrase en general', key: '11-1-engrase-en-general' },
    { code: '11.2', label: 'Nivel de aceite', key: '11-2-nivel-de-aceite' },
    { code: '11.3', label: 'Parada de emergencia (critico)', key: '11-3-parada-de-emergencia-critico' },
    { code: '11.4', label: 'Corta corriente (critico)', key: '11-4-corta-corriente-critico' },
    { code: '11.5', label: 'Pasadores sujecion de torre', key: '11-5-pasadores-sujecion-de-torre' },
    { code: '11.6', label: 'Cilindro de inclinacion', key: '11-6-cilindro-de-inclinacion' },
    { code: '11.7', label: 'Flexibles de Torres', key: '11-7-flexibles-de-torres' },
    { code: '11.8', label: 'Escala de acceso', key: '11-8-escala-de-acceso' },
    { code: '11.9', label: 'Estado de chasis en general', key: '11-9-estado-de-chasis-en-general' }
  ]},
  { key: 'direccion', title: 'Direccion', mode: 'sino', items: [
    { code: '12.1', label: 'Volante duro/con juego (critico)', key: '12-1-volante-duro-con-juego-critico' },
    { code: '12.2', label: 'Vibracion (critico)', key: '12-2-vibracion-critico' }
  ]},
  { key: 'suspension', title: 'Suspension', mode: 'sino', items: [
    { code: '13.1', label: 'Vehiculo desnivelado', key: '13-1-vehiculo-desnivelado' },
    { code: '13.2', label: 'Ruidos extranos al frenar', key: '13-2-ruidos-extranos-al-frenar' },
    { code: '13.3', label: 'Vehiculo se recarga hacia un lado', key: '13-3-vehiculo-se-recarga-hacia-un-lado' }
  ]}
];

const camionetaGroups = [
  { key: 'documentos', title: 'Documentos', mode: 'sino', items: [
    { code: '1.1', label: 'Revision Tecnica (critico)', key: '1-1-revision-tecnica-critico' },
    { code: '1.2', label: 'Permiso de Circulacion (critico)', key: '1-2-permiso-de-circulacion-critico' },
    { code: '1.3', label: 'Seguro Obligatorio (critico)', key: '1-3-seguro-obligatorio-critico' }
  ]},
  { key: 'identificacion', title: 'Identificacion', mode: 'bm', items: [
    { code: '2.1', label: 'Logos y numero de identificacion', key: '2-1-logos-y-numero-de-identificacion' }
  ]},
  { key: 'luces', title: 'Sistemas de Seguridad Activa - Luces', mode: 'bm', items: [
    { code: '3.1', label: 'Estado de baliza (critico mina y escolta)', key: '3-1-estado-de-baliza-critico-mina-y-escolta' },
    { code: '3.2', label: 'Pertiga (critico mina)', key: '3-2-pertiga-critico-mina' },
    { code: '3.3', label: 'Luces Intermitentes', key: '3-3-luces-intermitentes' },
    { code: '3.4', label: 'Luces Altas y bajas (critico)', key: '3-4-luces-altas-y-bajas-critico' },
    { code: '3.5', label: 'Luz de freno (critico)', key: '3-5-luz-de-freno-critico' },
    { code: '3.7', label: 'Alarma de retroceso (critico)', key: '3-7-alarma-de-retroceso-critico' }
  ]},
  { key: 'neumaticos', title: 'Neumaticos', mode: 'sino', items: [
    { code: '4.1', label: 'Desgaste de banda (critico)', key: '4-1-desgaste-de-banda-critico' },
    { code: '4.2', label: 'Corte lateral (critico)', key: '4-2-corte-lateral-critico' },
    { code: '4.3', label: 'Dibujo de neumatico', key: '4-3-dibujo-de-neumatico' },
    { code: '4.4', label: 'Neumatico de repuesto', key: '4-4-neumatico-de-repuesto' },
    { code: '4.5', label: 'Seguro de Traba Tuercas de Ruedas (critico)', key: '4-5-seguro-de-traba-tuercas-de-ruedas-critico' }
  ]},
  { key: 'esp', title: 'Estabilidad (ESP)', mode: 'sino', items: [
    { code: '5.1', label: 'Cuenta con sensor en tablero', key: '5-1-cuenta-con-sensor-en-tablero' },
    { code: '5.2', label: 'Luz indicadora esta apagado', key: '5-2-luz-indicadora-esta-apagado' }
  ]},
  { key: 'frenos', title: 'Frenos', mode: 'bm', items: [
    { code: '6.1', label: 'Freno de mano (critico)', key: '6-1-freno-de-mano-critico' },
    { code: '6.2', label: 'Freno de pedal (critico)', key: '6-2-freno-de-pedal-critico' }
  ]},
  { key: 'cabinaActiva', title: 'Cabina', mode: 'bm', items: [
    { code: '7.1', label: 'Espejo retrovisor (critico)', key: '7-1-espejo-retrovisor-critico' },
    { code: '7.2', label: 'Asientos', key: '7-2-asientos' },
    { code: '7.3', label: 'Bocina (critico)', key: '7-3-bocina-critico' },
    { code: '7.4', label: 'Aire acondicionado-calefaccion (critico)', key: '7-4-aire-acondicionado-calefaccion-critico' },
    { code: '7.5', label: 'Alza vidrio', key: '7-5-alza-vidrio' }
  ]},
  { key: 'seguridadPasiva', title: 'Sistemas de Seguridad Pasiva - Cabina', mode: 'bm', items: [
    { code: '8.1', label: 'Cinturones de seguridad (critico)', key: '8-1-cinturones-de-seguridad-critico' },
    { code: '8.2', label: 'Parabrisas (critico)', key: '8-2-parabrisas-critico' },
    { code: '8.3', label: 'Air Bag', key: '8-3-air-bag' },
    { code: '8.4', label: 'Asientos (apoyacabezas)', key: '8-4-asientos-apoyacabezas' }
  ]},
  { key: 'equipamientoSeguridad', title: 'Sistemas Complementarios - Equipamiento de Seguridad', mode: 'bm', items: [
    { code: '5.1', label: 'Triangulos', key: '5-1-triangulos' },
    { code: '5.2', label: 'Llave Rueda', key: '5-2-llave-rueda' },
    { code: '5.3', label: 'Botiquin', key: '5-3-botiquin' },
    { code: '5.4', label: 'Extintor', key: '5-4-extintor' },
    { code: '5.5', label: 'Dos cunas (critico)', key: '5-5-dos-cunas-critico' }
  ]},
  { key: 'direccion', title: 'Direccion', mode: 'sino', items: [
    { code: '7.1', label: 'Volante duro/con juego (critico)', key: '7-1-volante-duro-con-juego-critico' },
    { code: '7.2', label: 'Vibracion (critico)', key: '7-2-vibracion-critico' }
  ]},
  { key: 'suspension', title: 'Suspension', mode: 'sino', items: [
    { code: '10.1', label: 'Vehiculo desnivelado', key: '10-1-vehiculo-desnivelado' },
    { code: '10.2', label: 'Ruidos extranos al frenar', key: '10-2-ruidos-extranos-al-frenar' },
    { code: '10.3', label: 'Vehiculo se recarga hacia un lado', key: '10-3-vehiculo-se-recarga-hacia-un-lado' }
  ]}
];

const camionPlumaGroups = [
  { key: 'documentos', title: 'Documentos', mode: 'sino', items: [
    { code: '1.1', label: 'Documentacion del Camion (critico)', key: '1-1-documentacion-del-camion-critico' }
  ]},
  { key: 'identificacion', title: 'Identificacion', mode: 'bm', items: [
    { code: '2.1', label: 'Logos y numero de identificacion', key: '2-1-logos-y-numero-de-identificacion' }
  ]},
  { key: 'luces', title: 'Sistemas de Seguridad Activa - Luces', mode: 'bm', items: [
    { code: '3.1', label: 'Luces interiores', key: '3-1-luces-interiores' },
    { code: '3.2', label: 'Luces Intermitentes', key: '3-2-luces-intermitentes' },
    { code: '3.3', label: 'Luces Altas y bajas (critico)', key: '3-3-luces-altas-y-bajas-critico' },
    { code: '3.4', label: 'Luz de freno (critico)', key: '3-4-luz-de-freno-critico' },
    { code: '3.5', label: 'Luces de Trocha', key: '3-5-luces-de-trocha' },
    { code: '3.6', label: 'Alarma de retroceso (critico)', key: '3-6-alarma-de-retroceso-critico' }
  ]},
  { key: 'neumaticos', title: 'Neumaticos', mode: 'sino', items: [
    { code: '4.1', label: 'Desgaste de banda (critico)', key: '4-1-desgaste-de-banda-critico' },
    { code: '4.2', label: 'Corte lateral (critico)', key: '4-2-corte-lateral-critico' },
    { code: '4.3', label: 'Dibujo de neumatico', key: '4-3-dibujo-de-neumatico' },
    { code: '4.4', label: 'Neumatico de repuesto', key: '4-4-neumatico-de-repuesto' },
    { code: '4.5', label: 'Seguro de Traba Tuercas de Ruedas (critico)', key: '4-5-seguro-de-traba-tuercas-de-ruedas-critico' }
  ]},
  { key: 'esp', title: 'Estabilidad (ESP)', mode: 'sino', items: [
    { code: '5.1', label: 'Se advierte algun tipo de falla en sensor de tablero', key: '5-1-se-advierte-algun-tipo-de-falla-en-sensor-de-tablero' }
  ]},
  { key: 'frenos', title: 'Frenos', mode: 'bm', items: [
    { code: '6.1', label: 'Freno de mano (critico)', key: '6-1-freno-de-mano-critico' },
    { code: '6.2', label: 'Freno de pedal (critico)', key: '6-2-freno-de-pedal-critico' },
    { code: '6.3', label: 'Freno de Aire (critico)', key: '6-3-freno-de-aire-critico' },
    { code: '6.4', label: 'Freno manual de motor retardado', key: '6-4-freno-manual-de-motor-retardado' }
  ]},
  { key: 'cabina', title: 'Cabina', mode: 'bm', items: [
    { code: '7.2', label: 'Espejo retrovisor (critico)', key: '7-2-espejo-retrovisor-critico' },
    { code: '7.3', label: 'Desempanador de vidrio', key: '7-3-desempanador-de-vidrio' },
    { code: '7.4', label: 'Asientos', key: '7-4-asientos' },
    { code: '7.5', label: 'Bocina (critico)', key: '7-5-bocina-critico' },
    { code: '7.6', label: 'Aire acondicionado-calefaccion (critico)', key: '7-6-aire-acondicionado-calefaccion-critico' },
    { code: '7.7', label: 'Alza vidrio', key: '7-7-alza-vidrio' },
    { code: '7.8', label: 'Marcador de temperatura (critico)', key: '7-8-marcador-de-temperatura-critico' },
    { code: '7.9', label: 'Marcador de combustible', key: '7-9-marcador-de-combustible' },
    { code: '7.10', label: 'Camara de Retroceso (critico)', key: '7-10-camara-de-retroceso-critico' }
  ]},
  { key: 'seguridadPasiva', title: 'Sistemas de Seguridad Pasiva - Cabina', mode: 'bm', items: [
    { code: '8.1', label: 'Cinturones de seguridad (critico)', key: '8-1-cinturones-de-seguridad-critico' },
    { code: '8.2', label: 'Parabrisas (critico)', key: '8-2-parabrisas-critico' },
    { code: '8.3', label: 'Air Bag', key: '8-3-air-bag' },
    { code: '8.4', label: 'Asientos (apoyacabezas)', key: '8-4-asientos-apoyacabezas' }
  ]},
  { key: 'equipamientoSeguridad', title: 'Sistemas Complementarios - Equipamiento de Seguridad', mode: 'bm', items: [
    { code: '10.1', label: 'Triangulos', key: '10-1-triangulos' },
    { code: '10.2', label: 'Llave Rueda', key: '10-2-llave-rueda' },
    { code: '10.3', label: 'Botiquin', key: '10-3-botiquin' },
    { code: '10.4', label: 'Extintor y tarjeta', key: '10-4-extintor-y-tarjeta' },
    { code: '10.5', label: 'Cunas (critico)', key: '10-5-cunas-critico' }
  ]},
  { key: 'equipoExterior', title: 'Equipo / Exterior / Izaje', mode: 'bm', items: [
    { code: '11.1', label: 'Nivel de liquido refrigerante', key: '11-1-nivel-de-liquido-refrigerante' },
    { code: '11.2', label: 'Nivel de aceite', key: '11-2-nivel-de-aceite' },
    { code: '11.3', label: 'Nivel de Adblue', key: '11-3-nivel-de-adblue' },
    { code: '11.4', label: 'Corta corriente (critico)', key: '11-4-corta-corriente-critico' },
    { code: '11.5', label: 'Parada de emergencia (critico)', key: '11-5-parada-de-emergencia-critico' },
    { code: '11.6', label: 'Carroceria en general', key: '11-6-carroceria-en-general' },
    { code: '11.7', label: 'Peldanos acceso cabina', key: '11-7-peldanos-acceso-cabina' },
    { code: '11.8', label: 'Escala Acceso a Plataforma', key: '11-8-escala-acceso-a-plataforma' },
    { code: '11.9', label: 'Portalones, pilares y seguros', key: '11-9-portalones-pilares-y-seguros' },
    { code: '11.10', label: 'Parachoques', key: '11-10-parachoques' },
    { code: '11.11', label: 'Estado de almohadillas', key: '11-11-estado-de-almohadillas' },
    { code: '11.12', label: 'Estado de estabilizadores', key: '11-12-estado-de-estabilizadores' },
    { code: '11.13', label: 'Estado del gancho y seguro', key: '11-13-estado-del-gancho-y-seguro' },
    { code: '11.14', label: 'Anclaje de pluma a chasis del camion', key: '11-14-anclaje-de-pluma-a-chasis-del-camion' },
    { code: '11.15', label: 'Deslizadores de prolongacion de la pluma', key: '11-15-deslizadores-de-prolongacion-de-la-pluma' },
    { code: '11.16', label: 'Cilindro del brazo principal', key: '11-16-cilindro-del-brazo-principal' },
    { code: '11.17', label: 'Cilindro del brazo secundario', key: '11-17-cilindro-del-brazo-secundario' },
    { code: '11.18', label: 'Alarma de giro de la pluma', key: '11-18-alarma-de-giro-de-la-pluma' },
    { code: '11.19', label: 'Tabla de carga de pluma', key: '11-19-tabla-de-carga-de-pluma' },
    { code: '11.20', label: 'Limitador de giro de pluma/jaula virtual', key: '11-20-limitador-de-giro-de-pluma-jaula-virtual' },
    { code: '11.21', label: 'Estado de canerias, mangueras', key: '11-21-estado-de-canerias-mangueras' },
    { code: '11.22', label: 'Estabilizadores senalizados con cinta reflectante', key: '11-22-estabilizadores-senalizados-con-cinta-reflectante' }
  ]},
  { key: 'direccion', title: 'Direccion', mode: 'sino', items: [
    { code: '12.1', label: 'Volante duro/con juego (critico)', key: '12-1-volante-duro-con-juego-critico' },
    { code: '12.2', label: 'Vibracion (critico)', key: '12-2-vibracion-critico' }
  ]},
  { key: 'suspension', title: 'Suspension', mode: 'sino', items: [
    { code: '13.1', label: 'Vehiculo desnivelado', key: '13-1-vehiculo-desnivelado' },
    { code: '13.2', label: 'Ruidos extranos al frenar', key: '13-2-ruidos-extranos-al-frenar' },
    { code: '13.3', label: 'Vehiculo se recarga hacia un lado', key: '13-3-vehiculo-se-recarga-hacia-un-lado' }
  ]}
];

const camionGruaGroups = [
  { key: 'documentos', title: 'Documentos', mode: 'sino', items: [
    { code: '1.1', label: 'Documentacion del Camion (critico)', key: '1-1-documentacion-del-camion-critico' }
  ]},
  { key: 'identificacion', title: 'Identificacion', mode: 'bm', items: [
    { code: '2.1', label: 'Logos y numero de identificacion', key: '2-1-logos-y-numero-de-identificacion' }
  ]},
  { key: 'luces', title: 'Sistemas de Seguridad Activa - Luces', mode: 'bm', items: [
    { code: '3.1', label: 'Luces interiores', key: '3-1-luces-interiores' },
    { code: '3.2', label: 'Luces Intermitentes', key: '3-2-luces-intermitentes' },
    { code: '3.3', label: 'Luces Altas y bajas (critico)', key: '3-3-luces-altas-y-bajas-critico' },
    { code: '3.4', label: 'Luz de freno (critico)', key: '3-4-luz-de-freno-critico' },
    { code: '3.5', label: 'Luces de Trocha', key: '3-5-luces-de-trocha' },
    { code: '3.6', label: 'Alarma de retroceso (critico)', key: '3-6-alarma-de-retroceso-critico' }
  ]},
  { key: 'neumaticos', title: 'Neumaticos', mode: 'sino', items: [
    { code: '4.1', label: 'Desgaste de banda (critico)', key: '4-1-desgaste-de-banda-critico' },
    { code: '4.2', label: 'Corte lateral (critico)', key: '4-2-corte-lateral-critico' },
    { code: '4.3', label: 'Dibujo de neumatico', key: '4-3-dibujo-de-neumatico' },
    { code: '4.4', label: 'Neumatico de repuesto', key: '4-4-neumatico-de-repuesto' },
    { code: '4.5', label: 'Seguro de Traba Tuercas de Ruedas (critico)', key: '4-5-seguro-de-traba-tuercas-de-ruedas-critico' }
  ]},
  { key: 'esp', title: 'Estabilidad (ESP)', mode: 'sino', items: [
    { code: '5.1', label: 'Se advierte algun tipo de falla en sensor de tablero', key: '5-1-se-advierte-algun-tipo-de-falla-en-sensor-de-tablero' }
  ]},
  { key: 'frenos', title: 'Frenos', mode: 'bm', items: [
    { code: '6.1', label: 'Freno de mano (critico)', key: '6-1-freno-de-mano-critico' },
    { code: '6.2', label: 'Freno de pedal (critico)', key: '6-2-freno-de-pedal-critico' },
    { code: '6.3', label: 'Freno de Aire (critico)', key: '6-3-freno-de-aire-critico' },
    { code: '6.4', label: 'Freno manual de motor retardado', key: '6-4-freno-manual-de-motor-retardado' }
  ]},
  { key: 'cabina', title: 'Cabina', mode: 'bm', items: [
    { code: '7.2', label: 'Espejo retrovisor (critico)', key: '7-2-espejo-retrovisor-critico' },
    { code: '7.3', label: 'Desempanador de vidrio', key: '7-3-desempanador-de-vidrio' },
    { code: '7.4', label: 'Asientos', key: '7-4-asientos' },
    { code: '7.5', label: 'Bocina (critico)', key: '7-5-bocina-critico' },
    { code: '7.6', label: 'Aire acondicionado-calefaccion (critico)', key: '7-6-aire-acondicionado-calefaccion-critico' },
    { code: '7.7', label: 'Alza vidrio', key: '7-7-alza-vidrio' },
    { code: '7.8', label: 'Marcador de temperatura (critico)', key: '7-8-marcador-de-temperatura-critico' },
    { code: '7.9', label: 'Marcador de combustible', key: '7-9-marcador-de-combustible' },
    { code: '7.10', label: 'Camara de Retroceso (critico)', key: '7-10-camara-de-retroceso-critico' }
  ]},
  { key: 'seguridadPasiva', title: 'Sistemas de Seguridad Pasiva - Cabina', mode: 'bm', items: [
    { code: '8.1', label: 'Cinturones de seguridad (critico)', key: '8-1-cinturones-de-seguridad-critico' },
    { code: '8.2', label: 'Parabrisas (critico)', key: '8-2-parabrisas-critico' },
    { code: '8.3', label: 'Air Bag', key: '8-3-air-bag' },
    { code: '8.4', label: 'Asientos (apoyacabezas)', key: '8-4-asientos-apoyacabezas' }
  ]},
  { key: 'equipamientoSeguridad', title: 'Sistemas Complementarios - Equipamiento de Seguridad', mode: 'bm', items: [
    { code: '10.1', label: 'Triangulos', key: '10-1-triangulos' },
    { code: '10.2', label: 'Llave Rueda', key: '10-2-llave-rueda' },
    { code: '10.3', label: 'Botiquin', key: '10-3-botiquin' },
    { code: '10.4', label: 'Extintor y tarjeta', key: '10-4-extintor-y-tarjeta' },
    { code: '10.5', label: 'Cunas (critico)', key: '10-5-cunas-critico' }
  ]},
  { key: 'equipoExterior', title: 'Equipo / Exterior / Izaje', mode: 'bm', items: [
    { code: '11.1', label: 'Nivel de liquido refrigerante', key: '11-1-nivel-de-liquido-refrigerante' },
    { code: '11.2', label: 'Nivel de aceite', key: '11-2-nivel-de-aceite' },
    { code: '11.3', label: 'Nivel de Adblue', key: '11-3-nivel-de-adblue' },
    { code: '11.4', label: 'Corta corriente (critico)', key: '11-4-corta-corriente-critico' },
    { code: '11.5', label: 'Parada de emergencia (critico)', key: '11-5-parada-de-emergencia-critico' },
    { code: '11.6', label: 'Carroceria en general', key: '11-6-carroceria-en-general' },
    { code: '11.7', label: 'Peldanos acceso cabina', key: '11-7-peldanos-acceso-cabina' },
    { code: '11.8', label: 'Escala Acceso a Plataforma', key: '11-8-escala-acceso-a-plataforma' },
    { code: '11.9', label: 'Portalones, pilares y seguros', key: '11-9-portalones-pilares-y-seguros' },
    { code: '11.10', label: 'Parachoques', key: '11-10-parachoques' },
    { code: '11.11', label: 'Estado de almohadillas', key: '11-11-estado-de-almohadillas' },
    { code: '11.12', label: 'Estado de estabilizadores', key: '11-12-estado-de-estabilizadores' },
    { code: '11.13', label: 'Estado del gancho', key: '11-13-estado-del-gancho' },
    { code: '11.14', label: 'Estado y funcionamiento PAT o LMI', key: '11-14-estado-y-funcionamiento-pat-o-lmi' },
    { code: '11.15', label: 'Alarma de giro de la pluma', key: '11-15-alarma-de-giro-de-la-pluma' },
    { code: '11.16', label: 'Condicion del cable de elevacion', key: '11-16-condicion-del-cable-de-elevacion' },
    { code: '11.17', label: 'Limitador de giro de pluma/jaula virtual', key: '11-17-limitador-de-giro-de-pluma-jaula-virtual' },
    { code: '11.18', label: 'Limitador de carrera', key: '11-18-limitador-de-carrera' },
    { code: '11.19', label: 'Estabilizadores senalizados con cinta reflectante', key: '11-19-estabilizadores-senalizados-con-cinta-reflectante' },
    { code: '11.20', label: 'Largo del cordel del doble de longitud de la altura de la carga', key: '11-20-largo-del-cordel-del-doble-de-longitud-de-la-altura-de-la-carga' },
    { code: '11.21', label: 'Teflon y guia', key: '11-21-teflon-y-guia' },
    { code: '11.22', label: 'Posicion cable de elevacion con guias y poleas', key: '11-22-posicion-cable-de-elevacion-con-guias-y-poleas' },
    { code: '11.23', label: 'Pilares de soporte', key: '11-23-pilares-de-soporte' }
  ]},
  { key: 'direccion', title: 'Direccion', mode: 'sino', items: [
    { code: '12.1', label: 'Volante duro/con juego (critico)', key: '12-1-volante-duro-con-juego-critico' },
    { code: '12.2', label: 'Vibracion (critico)', key: '12-2-vibracion-critico' }
  ]},
  { key: 'suspension', title: 'Suspension', mode: 'sino', items: [
    { code: '13.1', label: 'Vehiculo desnivelado', key: '13-1-vehiculo-desnivelado' },
    { code: '13.2', label: 'Ruidos extranos al frenar', key: '13-2-ruidos-extranos-al-frenar' },
    { code: '13.3', label: 'Vehiculo se recarga hacia un lado', key: '13-3-vehiculo-se-recarga-hacia-un-lado' }
  ]}
];

const camionRamplaGroups = [
  { key: 'documentos', title: 'Documentos', mode: 'sino', items: [
    { code: '1.1', label: 'Documentacion del Camion', key: '1-1-documentacion-del-camion' }
  ]},
  { key: 'identificacion', title: 'Identificacion', mode: 'bm', items: [
    { code: '2.1', label: 'Logos y numero de identificacion', key: '2-1-logos-y-numero-de-identificacion' }
  ]},
  { key: 'luces', title: 'Sistemas de Seguridad Activa - Luces', mode: 'bm', items: [
    { code: '3.1', label: 'Estado de baliza (critico mina y escolta)', key: '3-1-estado-de-baliza-critico-mina-y-escolta' },
    { code: '3.2', label: 'Luces interiores', key: '3-2-luces-interiores' },
    { code: '3.3', label: 'Luces Intermitentes', key: '3-3-luces-intermitentes' },
    { code: '3.4', label: 'Luces Altas y bajas (critico)', key: '3-4-luces-altas-y-bajas-critico' },
    { code: '3.5', label: 'Luz de freno (critico)', key: '3-5-luz-de-freno-critico' },
    { code: '3.6', label: 'Luces de Trocha', key: '3-6-luces-de-trocha' },
    { code: '3.7', label: 'Alarma de retroceso (critico)', key: '3-7-alarma-de-retroceso-critico' }
  ]},
  { key: 'neumaticos', title: 'Neumaticos', mode: 'sino', items: [
    { code: '4.1', label: 'Desgaste de banda (critico)', key: '4-1-desgaste-de-banda-critico' },
    { code: '4.2', label: 'Corte lateral (critico)', key: '4-2-corte-lateral-critico' },
    { code: '4.3', label: 'Dibujo de neumatico', key: '4-3-dibujo-de-neumatico' },
    { code: '4.4', label: 'Neumatico de repuesto', key: '4-4-neumatico-de-repuesto' },
    { code: '4.5', label: 'Seguro de Traba Tuercas de Ruedas (critico)', key: '4-5-seguro-de-traba-tuercas-de-ruedas-critico' },
    { code: '4.6', label: 'Seguro de quinta rueda', key: '4-6-seguro-de-quinta-rueda' }
  ]},
  { key: 'esp', title: 'Estabilidad (ESP)', mode: 'sino', items: [
    { code: '5.1', label: 'Se advierte algun tipo de falla en sensor de tablero', key: '5-1-se-advierte-algun-tipo-de-falla-en-sensor-de-tablero' }
  ]},
  { key: 'frenos', title: 'Frenos', mode: 'bm', items: [
    { code: '6.1', label: 'Freno de mano (critico)', key: '6-1-freno-de-mano-critico' },
    { code: '6.2', label: 'Freno de pedal (critico)', key: '6-2-freno-de-pedal-critico' },
    { code: '6.3', label: 'Freno de Aire (critico)', key: '6-3-freno-de-aire-critico' }
  ]},
  { key: 'cabina', title: 'Cabina', mode: 'bm', items: [
    { code: '7.2', label: 'Espejo retrovisor (critico)', key: '7-2-espejo-retrovisor-critico' },
    { code: '7.3', label: 'Desempanador de vidrio', key: '7-3-desempanador-de-vidrio' },
    { code: '7.4', label: 'Asientos', key: '7-4-asientos' },
    { code: '7.5', label: 'Bocina (critico)', key: '7-5-bocina-critico' },
    { code: '7.6', label: 'Aire acondicionado-calefaccion (critico)', key: '7-6-aire-acondicionado-calefaccion-critico' },
    { code: '7.7', label: 'Alza vidrio', key: '7-7-alza-vidrio' },
    { code: '7.8', label: 'Camara de Retroceso (critico)', key: '7-8-camara-de-retroceso-critico' },
    { code: '7.9', label: 'Marcador de temperatura (critico)', key: '7-9-marcador-de-temperatura-critico' },
    { code: '7.10', label: 'Marcador de combustible', key: '7-10-marcador-de-combustible' }
  ]},
  { key: 'seguridadPasiva', title: 'Sistemas de Seguridad Pasiva - Cabina', mode: 'bm', items: [
    { code: '8.1', label: 'Cinturones de seguridad (critico)', key: '8-1-cinturones-de-seguridad-critico' },
    { code: '8.2', label: 'Parabrisas (critico)', key: '8-2-parabrisas-critico' },
    { code: '8.3', label: 'Air Bag', key: '8-3-air-bag' },
    { code: '8.4', label: 'Asientos (apoyacabezas)', key: '8-4-asientos-apoyacabezas' }
  ]},
  { key: 'equipamientoSeguridad', title: 'Sistemas Complementarios - Equipamiento de Seguridad', mode: 'bm', items: [
    { code: '10.1', label: 'Triangulos', key: '10-1-triangulos' },
    { code: '10.2', label: 'Llave Rueda', key: '10-2-llave-rueda' },
    { code: '10.3', label: 'Botiquin', key: '10-3-botiquin' },
    { code: '10.4', label: 'Extintor', key: '10-4-extintor' },
    { code: '10.5', label: 'Cunas (critico)', key: '10-5-cunas-critico' }
  ]},
  { key: 'equipoExterior', title: 'Equipo / Exterior', mode: 'bm', items: [
    { code: '11.1', label: 'Nivel de liquido refrigerante', key: '11-1-nivel-de-liquido-refrigerante' },
    { code: '11.2', label: 'Nivel de Adblue', key: '11-2-nivel-de-adblue' },
    { code: '11.3', label: 'Corta corriente (critico)', key: '11-3-corta-corriente-critico' },
    { code: '11.4', label: 'Parada de emergencia (critico)', key: '11-4-parada-de-emergencia-critico' },
    { code: '11.5', label: 'Parachoques', key: '11-5-parachoques' },
    { code: '11.6', label: 'Portalones, pilares y seguros', key: '11-6-portalones-pilares-y-seguros' },
    { code: '11.7', label: 'Peldanos acceso cabina', key: '11-7-peldanos-acceso-cabina' },
    { code: '11.8', label: 'Escala Acceso a Plataforma', key: '11-8-escala-acceso-a-plataforma' },
    { code: '11.9', label: 'Mangueras', key: '11-9-mangueras' },
    { code: '11.10', label: 'Carroceria en general', key: '11-10-carroceria-en-general' }
  ]},
  { key: 'direccion', title: 'Direccion', mode: 'sino', items: [
    { code: '12.1', label: 'Volante duro/con juego (critico)', key: '12-1-volante-duro-con-juego-critico' },
    { code: '12.2', label: 'Vibracion (critico)', key: '12-2-vibracion-critico' }
  ]},
  { key: 'suspension', title: 'Suspension', mode: 'sino', items: [
    { code: '13.1', label: 'Vehiculo desnivelado', key: '13-1-vehiculo-desnivelado' },
    { code: '13.2', label: 'Ruidos extranos al frenar', key: '13-2-ruidos-extranos-al-frenar' },
    { code: '13.3', label: 'Vehiculo se recarga hacia un lado', key: '13-3-vehiculo-se-recarga-hacia-un-lado' }
  ]}
];

const visibilidadGroups = [
  {
    id: 'ropa',
    title: 'Ropa de Alta Visibilidad Fluorescente Retroreflectante',
    stateType: 'bm',
    items: [
      { numero: 1, label: 'Ropa color fluorescente (naranjo o amarillo).', id: 'item-1' },
      { numero: 2, label: 'Revisar que las bandas reflectantes esten intactas y bien adheridas.', id: 'item-2' },
      { numero: 3, label: 'Comprobar que las bandas no esten desgastadas o dañadas.', id: 'item-3' },
      { numero: 4, label: 'Asegurarse de que en la ropa no haya decoloracion significativa.', id: 'item-4' },
      { numero: 5, label: 'Verificar que la ropa este limpia y libre de suciedad excesiva.', id: 'item-5' },
      { numero: 6, label: 'Inspeccionar por desgarros, agujeros o rasguños en la tela.', id: 'item-6' }
    ]
  },
  {
    id: 'cintas',
    title: 'Cintas reflectantes, Pertiga y Baliza',
    stateType: 'sino',
    items: [
      { numero: 7, label: 'Color del vehiculo liviano de alta visibilidad.', id: 'item-7' },
      { numero: 8, label: 'Cintas reflectantes reglamentarias en vehiculos/equipos segun altura. Confirmar visibilidad lateral y posterior. Validar cumplimiento de numero visible.', id: 'item-8' }
    ]
  },
  {
    id: 'mina',
    title: 'Exclusivo Area Mina',
    stateType: 'sino',
    items: [
      { numero: 9, label: 'Pertiga con banderin reflectante y luz intermitente visible. Confirmar altura minima (>= 4,60 m) y que se encuentra encendida en zonas mina.', id: 'item-9' },
      { numero: 10, label: 'Baliza instaladas con visibilidad 360°. Confirmar encendido continuo durante operacion (area mina - escoltas).', id: 'item-10' }
    ]
  }
];

const extintorCdchConfigs = {
  extintor: {
    title: 'Extintor CDCH',
    descripcionFields: [
      { key: 'numeroInterno', label: 'N INTERNO' },
      { key: 'capacidadKg', label: 'CAPACIDAD KG' }
    ],
    items: [
      { numero: 1, label: 'ESTA CLASIFICADO SEGUN LOS TIPOS DE FUEGO' },
      { numero: 2, label: 'SE ENCUENTRA CODIFICADO' },
      { numero: 4, label: 'ESTA UBICADO EN EL LUGAR DESIGNADO Y EN POSICION CORRECTA' },
      { numero: 5, label: 'SE ENCUENTRA CLARAMENTE VISIBLE' },
      { numero: 6, label: 'EL ACCESO AL EXTINTOR SE ENCUENTRA LIBRE DE OBSTACULOS' },
      { numero: 7, label: 'EL SOPORTE DEL EXTINTOR SE ENCUENTRA EN BUENAS CONDICIONES' },
      { numero: 8, label: 'NO PRESENTA SENALES NI SIGNOS DE CORROSION' },
      { numero: 9, label: 'ESTA LIBRE DE FUGAS O FILTRACIONES' },
      { numero: 10, label: 'ESTADO DE EXTINTOR (GOLPES, ABOLLADURAS, CORROSION, PINTURA)' },
      { numero: 13, label: 'EL CONJUNTO DE MANGUERAS Y ACOPLES ESTAN EN BUENAS CONDICIONES' },
      { numero: 14, label: 'LA BOQUILLA DE DESCARGA ESTA EN BUENAS CONDICIONES' },
      { numero: 15, label: 'LA PALANCA DE DESCARGA ESTA EN BUENAS CONDICIONES DE USO' },
      { numero: 16, label: 'LA MANILLA DE TRANSPORTE SE ENCUENTRA EN BUENAS CONDICIONES DE USO' },
      { numero: 18, label: 'EL MANOMETRO DE PRESION (INDICADOR DE CARGA) SE ENCUENTRA EN BUENAS CONDICIONES' },
      { numero: 19, label: 'TIENE VISIBLE Y LEGIBLE LA ETIQUETA DE REVISION MENSUAL' },
      { numero: 20, label: 'SE ENCUENTRA DEBIDAMENTE SENALIZADO' }
    ]
  },
  grillete: {
    title: 'Grillete CDCH',
    descripcionFields: [
      { key: 'medida', label: 'MEDIDA' },
      { key: 'codificacion', label: 'CODIFICACION' }
    ],
    items: [
      { numero: 1, label: 'CUERPO' },
      { numero: 2, label: 'CORONA' },
      { numero: 3, label: 'PASADOR' },
      { numero: 4, label: 'ENTRADA' },
      { numero: 5, label: 'HILOS DEL PASADOR' }
    ]
  },
  retractil: {
    title: 'Línea de Vida Retráctil CDCH',
    descripcionFields: [
      { key: 'marca', label: 'MARCA' },
      { key: 'modelo', label: 'MODELO' }
    ],
    items: [
      { numero: 1, label: 'MANIJA DE ANCLAJE' },
      { numero: 2, label: 'ESTADO DE LA CARCASA' },
      { numero: 3, label: 'LINEA DE VIDA ACERO GALVANIZADO' },
      { numero: 4, label: 'TOPE' },
      { numero: 5, label: 'GANCHO DE SEGURIDAD DE CIERRE AUTOMATICO' },
      { numero: 6, label: 'MOSQUETON' },
      { numero: 7, label: 'ASA DE TRANSPORTE' },
      { numero: 8, label: 'INDICADOR DE IMPACTO' },
      { numero: 9, label: 'ESTADO DE RETRACTIL' },
      { numero: 10, label: 'ETIQUETAS DE INFORMACION' },
      { numero: 11, label: 'CODIFICACION DE COLOR' }
    ]
  }
};

function getWeeklyChecklistConfig(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('alzahombre')) {
    return {
      title: 'Alza Hombre',
      groups: alzaHombreGroups,
      days: alzaHombreDays,
      metrics: ['horometro']
    };
  }
  if (t.includes('gruahorquilla')) {
    return {
      title: 'Grúa Horquilla',
      groups: gruaHorquillaGroups,
      days: alzaHombreDays,
      metrics: ['horometro']
    };
  }
  if (t.includes('camioneta')) {
    return {
      title: 'Camioneta',
      groups: camionetaGroups,
      days: alzaHombreDays,
      metrics: []
    };
  }
  if (t.includes('camionpluma')) {
    return {
      title: 'Camión Pluma',
      groups: camionPlumaGroups,
      days: alzaHombreDays,
      metrics: ['kilometraje', 'horometro']
    };
  }
  if (t.includes('camiongrua')) {
    return {
      title: 'Camión Grúa',
      groups: camionGruaGroups,
      days: alzaHombreDays,
      metrics: ['kilometraje', 'horometro']
    };
  }
  if (t.includes('camionrampla')) {
    return {
      title: 'Camión Rampla',
      groups: camionRamplaGroups,
      days: alzaHombreDays,
      metrics: ['kilometraje', 'horometro']
    };
  }
  return null;
}

function getCdchConfig(type) {
  const t = String(type || '').toLowerCase();
  if (t.includes('grillete')) return extintorCdchConfigs.grillete;
  if (t.includes('retractil')) return extintorCdchConfigs.retractil;
  if (t.includes('extintor')) return extintorCdchConfigs.extintor;
  return null;
}

function addDaysIso(dateStr, daysToAdd) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const date = new Date(year, month, day);
  date.setDate(date.getDate() + Number(daysToAdd));
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getWeeklyValClass(val) {
  if (!val) return '';
  const v = String(val).toLowerCase().trim();
  if (v === 'si' || v === 'b') return 'weekly-val-ok';
  if (v === 'no' || v === 'm') return 'weekly-val-bad';
  return '';
}

const imagenEmpresa = ref('');
const imagenEmpresaTransmac = ref('');

const surveyDetailStore = useSurveyDetailStore()

const idSurvey = ref('')
const route = useRoute()
const surveys = ref(null);
const user = ref({})
const superiorUser = ref(null)
const usarTablaFirmas = ref(true)
const flowStepsActuales = ref([])
const equiposProyectosMiembrosFES = ref([])

// Inicial
idSurvey.value = route.query.idInspeccion || route.query.idSurvey || route.query.id_survey || ''

const qrMap = ref({})

const hasCabeceraGPS = computed(() => {
  const lat = getCabeceraLat();
  const lng = getCabeceraLng();
  return lat !== null && lng !== null;
});

const lineasServicio = computed(() => {
  const s = surveyDetailStore.surveyDetail?.[0]
  if (!s) return []
  try {
    let jsonF = s.json_field
    if (typeof jsonF === 'string') jsonF = JSON.parse(jsonF)
    if (jsonF?.crm_v1?.lineas_servicio?.length) return jsonF.crm_v1.lineas_servicio
  } catch (e) {}

  try {
    let bExec = s.body_exec
    if (typeof bExec === 'string') bExec = JSON.parse(bExec)
    if (typeof bExec === 'string') bExec = JSON.parse(bExec)
    if (bExec?.lineas_servicio?.length) return bExec.lineas_servicio
    if (bExec?.segmentos) {
      for (const seg of bExec.segmentos) {
        const attr = seg.attributes?.find(a => a.type === 'estructuradorServicios' || (a.label && (a.label.includes('ESTRUCTURADOR') || a.label.includes('LÍNEAS'))))
        if (attr?.lineas?.length) return attr.lineas
      }
    }
  } catch (e) {}

  return []
})

const totalServicios = computed(() => {
  return lineasServicio.value.reduce((acc, item) => {
    const qty = Number(item.cantidad || item.cant || 1)
    const price = Number(item.valorUnitario || item.valor_unitario || item.precio || 0)
    return acc + (qty * price)
  }, 0)
})

function getCabeceraLat() {
  const s = surveyDetailStore.surveyDetail?.[0];
  const lat = s?.latitud ?? s?.latitude;
  return lat && !Number.isNaN(parseFloat(lat)) && parseFloat(lat) !== 0 ? parseFloat(lat) : null;
}

function getCabeceraLng() {
  const s = surveyDetailStore.surveyDetail?.[0];
  const lng = s?.longitud ?? s?.longitude;
  return lng && !Number.isNaN(parseFloat(lng)) && parseFloat(lng) !== 0 ? parseFloat(lng) : null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''
const BASE_URL = `${API_BASE_URL}/archivo/gsp/`

const getLogoUrl = (logoName) => {
  if (!logoName) return '';
  if (logoName.startsWith('data:')) {
    return logoName;
  }
  if (logoName.startsWith('logo_') || logoName.startsWith('logo-')) {
    const host = window.location.origin;
    const base = import.meta.env.BASE_URL || '/';
    const baseUrl = base.endsWith('/') ? base : `${base}/`;
    return `${host}${baseUrl}${logoName}`;
  }
  return `${API_BASE_URL}/archivo/gsp/${logoName}`;
};

function getLat(attr) {
  const lat = attr?.default?.lat ?? attr?.default?.latitude ?? attr?.lat;
  return lat ? parseFloat(lat) : null;
}

function getLng(attr) {
  const lng = attr?.default?.lng ?? attr?.default?.longitude ?? attr?.lng;
  return lng ? parseFloat(lng) : null;
}

// Watch para cambios
watch(() => route.query.idInspeccion || route.query.idSurvey || route.query.id_survey, async (newId) => {
  if (newId && newId !== idSurvey.value) {
    idSurvey.value = newId
    await getSurvey()
  }
})

onMounted(async () => {
  await getSurvey();
  console.log("SURVEY DETAIL JSON:", JSON.stringify(surveyDetailStore.surveyDetail, null, 2));
  await nextTick();

  const segmentos = (surveyDetailStore.surveyDetail || [])
    .flatMap(s => getSegmentos(s));

  if (import.meta.env.DEV) {
    const ingresoAttrs = segmentos
      .flatMap(seg => seg?.attributes || [])
      .filter(a => a?.type === 'ingresoZanja');
    console.log('[Print][ingresoZanja] attrs:', ingresoAttrs.length);
    ingresoAttrs.forEach((a, i) => {
      const rows = getIngresoRows(a);
      console.log(`[Print][ingresoZanja][${i}] rows:`, rows.length, 'keys:', Object.keys(a || {}));
      if (rows[0]?.raw && typeof rows[0].raw === 'object') {
        console.log(`[Print][ingresoZanja][${i}] firstRowKeys:`, Object.keys(rows[0].raw));
      }
    });
  }

  await renderAllCharts(segmentos); // ← pinta todos los gráficos
  // opcional: window.print();
});

function formatCL(isoOrDate) {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  if (Number.isNaN(d.getTime())) return String(isoOrDate)
  return d.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

function emItemNombre(attr, row) {
  const id = row?.itemId ?? null
  const catalogo = Array.isArray(attr?.itemsCatalogo) ? attr.itemsCatalogo : []
  const found = catalogo.find(x => String(x?.id) === String(id))
  return found?.nombre ?? found?.name ?? (id ?? '—')
}

function resolveImgSrc(x) {
  if (!x) return '';

  // string: puede ser base64, url absoluta o filename
  if (typeof x === 'string') {
    const s = x.trim();
    if (!s) return '';
    if (s.startsWith('data:image/')) return s;
    if (/^https?:\/\//i.test(s)) {
      if (s.includes('/archivo/transmac/')) {
        return s.replace('/archivo/transmac/', '/archivo/gsp/');
      }
      return s;
    }
    return BASE_URL + s; // filename -> URL absoluta gsp
  }

  // object: {url}, {base64}, {id_doc}, {name_doc_interno}
  if (typeof x === 'object') {
    if (x.base64 && typeof x.base64 === 'string' && x.base64.startsWith('data:image/')) {
      return x.base64;
    }
    if (x.id_doc) {
      return `${API_BASE_URL}/v1/storage/view/${x.id_doc}`;
    }
    if (x.name_doc_interno || x.nombre) {
      const name = String(x.name_doc_interno || x.nombre).trim();
      if (name.includes('.')) {
        return `${API_BASE_URL}/archivo/gsp/${name}`;
      }
    }
    if (x.url) {
      let s = String(x.url).trim();
      if (!s) return '';
      if (s.startsWith('data:image/')) return s;
      if (s.includes('/archivo/transmac/')) {
        s = s.replace('/archivo/transmac/', '/archivo/gsp/');
      }
      if (/^https?:\/\//i.test(s)) return s;
      // si viene relativo tipo "/archivo/gsp/xxx.jpg"
      return API_BASE_URL + (s.startsWith('/') ? '' : '/') + s;
    }
    if (x.base64 && typeof x.base64 === 'string') {
      return x.base64;
    }
  }

  return '';
}

function isImageDoc(x) {
  if (!x) return false;
  const str = (typeof x === 'string' ? x : (x.name_doc_interno || x.url || x.name || x.nombre || '')).toLowerCase();
  if (str.startsWith('data:image/')) return true;
  return /\.(png|jpe?g|gif|webp|svg)($|\?)/.test(str) || str.includes('firma') || (x?.type === 'photo' || x?.type === 'photoCapture');
}

function getObsRecRows(attr) {
  return Array.isArray(attr?.body) ? attr.body : [];
}

function getObsRecText(row, key) {
  if (Array.isArray(row)) {
    const idx = key === 'observacion' ? 0 : 1;
    return row?.[idx]?.value ?? row?.[idx] ?? '';
  }
  if (row && typeof row === 'object') {
    if (key === 'observacion') return row.observaciones ?? row.observacion ?? row.observacionText ?? row.obs ?? '';
    return row.recomendacion ?? row.recomendaciones ?? row.recomendacionText ?? row.recom ?? '';
  }
  return '';
}

function getObsRecPhotos(row) {
  if (Array.isArray(row)) {
    const raw = row?.[2]?.galeria ?? row?.[2]?.value ?? row?.[2];
    return Array.isArray(raw) ? raw.filter(Boolean) : (raw ? [raw] : []);
  }
  if (row && typeof row === 'object') {
    const raw = row.fotos ?? row.galeria ?? row.images ?? row.imagenes ?? [];
    return Array.isArray(raw) ? raw.filter(Boolean) : (raw ? [raw] : []);
  }
  return [];
}

function getSpecialRows(attr) {
  const parseMaybeJSON = (v) => {
    if (v == null) return null;
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s) return null;
      try { return JSON.parse(s); } catch { return null; }
    }
    return v;
  };

  const pickRowsFrom = (src) => {
    if (!src) return [];
    if (Array.isArray(src)) return src;
    if (typeof src !== 'object') return [];

    const keys = [
      'body', 'checkBoby', 'rows', 'items', 'data', 'values',
      'registros', 'trabajadores', 'personal', 'detalle', 'list',
    ];
    for (const k of keys) {
      const v = parseMaybeJSON(src[k]);
      if (Array.isArray(v)) return v;
      if (v && typeof v === 'object') {
        for (const kk of keys) {
          const vv = parseMaybeJSON(v[kk]);
          if (Array.isArray(vv)) return vv;
        }
      }
    }
    return [];
  };

  const roots = [
    attr?.body,
    attr?.checkBoby,
    attr?.rows,
    attr?.items,
    attr?.data,
    attr?.values,
    attr?.default,
    attr?.value,
  ];

  for (const raw of roots) {
    const parsed = parseMaybeJSON(raw);
    const rows = pickRowsFrom(parsed);
    if (rows.length) return rows;
    if (Array.isArray(parsed)) return parsed;
  }

  return [];
}

function getTeclesRows(attr) {
  return getSpecialRows(attr);
}

function hasResultMark(item, expected) {
  if (!item || typeof item !== 'object') return false;
  const e = String(expected || '').toLowerCase();

  if (isTruthyDayValue(item[e])) return true;
  if (e === 'na' && (isTruthyDayValue(item['n/a']) || isTruthyDayValue(item.na))) return true;

  const raw = item.resultado ?? item.estado ?? item.value ?? item.default ?? item.valor ?? '';
  const val = String(raw).trim().toLowerCase();
  if (!val) return false;
  if (e === 'na') return val === 'na' || val === 'n/a' || val.includes('aplica');
  return val === e || (e === 'si' && val === 'sí');
}

function getIngresoRows(attr) {
  const rows = getSpecialRows(attr);
  // Formato evento (una fila por acceso): lo pivotamos a una fila por trabajador.
  if (rows.length && rows.some(r => r && typeof r === 'object' && (r.acceso != null || r.horaEntrada != null || r.horaSalida != null))) {
    const grouped = new Map();

    const ordered = [...rows].sort((a, b) => {
      const da = new Date(a?.fecha || 0).getTime() || 0;
      const db = new Date(b?.fecha || 0).getTime() || 0;
      if (da !== db) return da - db;
      return String(a?.uid || '').localeCompare(String(b?.uid || ''));
    });

    ordered.forEach((ev) => {
      if (!ev || typeof ev !== 'object') return;
      const acceso = Number(ev.acceso);
      if (!Number.isFinite(acceso) || acceso < 1 || acceso > 8) return;

      const key = String(ev.trabajadorId ?? ev.trabajadorNombre ?? ev.nombre ?? ev.trabajador ?? ev.name ?? `row-${acceso}`);
      if (!grouped.has(key)) {
        grouped.set(key, {
          raw: { accesos: Array.from({ length: 8 }, () => ({})) },
          nombre: ev.trabajadorNombre ?? ev.nombre ?? ev.trabajador ?? ev.name ?? '',
          trabajadorId: ev.trabajadorId ?? null,
        });
      }

      const g = grouped.get(key);
      const slot = g.raw.accesos[acceso - 1] || {};
      if (ev.horaEntrada != null && ev.horaEntrada !== '') slot.horaEntrada = String(ev.horaEntrada);
      if (ev.horaSalida != null && ev.horaSalida !== '') slot.horaSalida = String(ev.horaSalida);
      g.raw.accesos[acceso - 1] = slot;
    });

    return Array.from(grouped.values());
  }

  if (!rows.length) {
    const parseMaybeJSON = (v) => {
      if (v == null) return null;
      if (typeof v === 'string') {
        const s = v.trim();
        if (!s) return null;
        try { return JSON.parse(s); } catch { return null; }
      }
      return v;
    };

    const single =
      parseMaybeJSON(attr?.default)
      ?? parseMaybeJSON(attr?.value)
      ?? parseMaybeJSON(attr?.body)
      ?? parseMaybeJSON(attr?.data)
      ?? ((attr && typeof attr === 'object') ? attr : null);

    const hasIngresoData = Object.keys(single || {}).some(k => /acceso|entrada|salida|hora|trabajador|nombre/i.test(String(k)));
    if (hasIngresoData) {
      return [{
        raw: single,
        nombre: single?.nombre ?? single?.trabajador ?? single?.name ?? single?.label ?? '',
      }];
    }
  }

  return rows.map(r => ({
    raw: r,
    nombre: r?.nombre ?? r?.trabajador ?? r?.name ?? r?.label ?? '',
  }));
}

function getIngresoTime(row, acceso, tipo) {
  const r = row?.raw || {};
  const t = tipo === 'entrada' ? 'entrada' : 'salida';
  const altT = t === 'entrada' ? 'salida' : 'entrada';

  const fromNested = r?.accesos?.[acceso - 1]?.[t]
    ?? r?.accesos?.[acceso - 1]?.[t === 'entrada' ? 'horaEntrada' : 'horaSalida']
    ?? r?.accesos?.[acceso - 1]?.[t === 'entrada' ? 'entry' : 'exit']
    ?? r?.accesos?.[acceso - 1]?.[t === 'entrada' ? 'in' : 'out']
    ?? r?.accesos?.[acceso]?.[t]
    ?? r?.accesos?.[acceso]?.[t === 'entrada' ? 'horaEntrada' : 'horaSalida']
    ?? r?.accesos?.[`acceso${acceso}`]?.[t]
    ?? r?.accesos?.[`acceso${acceso}`]?.[t === 'entrada' ? 'horaEntrada' : 'horaSalida']
    ?? r?.[`acceso${acceso}`]?.[t]
    ?? r?.[`acceso${acceso}`]?.[t === 'entrada' ? 'horaEntrada' : 'horaSalida']
    ?? r?.[`acceso_${acceso}`]?.[t]
    ?? r?.[`acceso_${acceso}`]?.[t === 'entrada' ? 'horaEntrada' : 'horaSalida'];
  if (fromNested != null && fromNested !== '') return String(fromNested);

  const keyA = `acceso${acceso}_${t}`;
  const keyB = `acceso_${acceso}_${t}`;
  const keyC = `a${acceso}_${t}`;
  const keyD = `hora_${t}_${acceso}`;
  const keyE = `${t}_acceso${acceso}`;
  const keyF = `acceso${acceso}${t}`;
  const keyG = `${t}${acceso}`;
  const keyH = t === 'entrada' ? `horaEntrada${acceso}` : `horaSalida${acceso}`;
  const keyI = t === 'entrada' ? `hora_entrada${acceso}` : `hora_salida${acceso}`;
  const keyJ = t === 'entrada' ? `entrada_acceso_${acceso}` : `salida_acceso_${acceso}`;
  const keyK = t === 'entrada' ? `horaEntradaAcceso${acceso}` : `horaSalidaAcceso${acceso}`;
  const keyL = t === 'entrada' ? `acceso${acceso}HoraEntrada` : `acceso${acceso}HoraSalida`;
  const keyM = t === 'entrada' ? `entrada${acceso}` : `salida${acceso}`;
  const keyN = t === 'entrada' ? `acceso_${acceso}_hora_entrada` : `acceso_${acceso}_hora_salida`;

  const direct = r?.[keyA] ?? r?.[keyB] ?? r?.[keyC] ?? r?.[keyD] ?? r?.[keyE] ?? r?.[keyF] ?? r?.[keyG] ?? r?.[keyH] ?? r?.[keyI] ?? r?.[keyJ] ?? r?.[keyK] ?? r?.[keyL] ?? r?.[keyM] ?? r?.[keyN];
  if (direct != null && direct !== '') return String(direct);

  // Fallback robusto para claves con espacios/acentos/guiones: "Acceso 3 Hora Entrada", etc.
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
  const hasAccess = `acceso${acceso}`;
  const token = t === 'entrada' ? 'entrada' : 'salida';
  const altToken = t === 'entrada' ? 'horaentrada' : 'horasalida';
  const englishToken = t === 'entrada' ? 'entry' : 'exit';
  const ioToken = t === 'entrada' ? 'in' : 'out';

  for (const [k, v] of Object.entries(r || {})) {
    if (v == null || v === '' || typeof v === 'object') continue;
    const nk = norm(k);
    if (!nk.includes(hasAccess)) continue;
    if (nk.includes(token) || nk.includes(altToken) || nk.includes(englishToken) || nk.endsWith(ioToken)) {
      return String(v);
    }
    // evita cruzar entrada/salida si solo existe el otro tipo
    if (!nk.includes(altT) && nk.includes('hora')) return String(v);
  }

  return '';
}

const EXTINTOR_DEFAULT_CHECK_LABELS = [
  'El extintor está completamente cargado y operable',
  'Las calcomanías y las placas de instrucción están legibles y en el frente del extintor (Tipo/Fecha)',
  'El extintor tiene el sello de seguridad',
  'El extintor tienen el pasador o pin de seguridad',
  'La pintura del cilindro está en buen estado',
  'El cilindro está en buen estado, sin oxidación, roturas, abolladuras, golpes o deformaciones',
  'La manguera del extintor está en buen estado, sin roturas, poros, agrietamientos u obstrucciones con papel, insectos, entre otros.',
  'Las uniones de manguera o boquilla se encuentran firme y en buen estado',
  'La válvula no presenta oxidación, daños en la manija, deformaciones que impidan su funcionamiento',
  'Manómetro en buen estado',
  'La lectura de presión está dentro del rango operable',
  'El extintor se encuentra bien ubicado, señalizado, libre de obstáculos',
  'En el caso de encontrarse ubicado en la intemperie, se encuentra protegido del ambiente con gabinete cerrado o funda',
];

function normalizeExtintorCheck(v) {
  const raw = String(v ?? '').trim().toUpperCase();
  if (raw === 'CN') return 'NC';
  if (raw === 'C' || raw === 'NC') return raw;
  return '';
}

function getExtintorRowsForPrint(attr) {
  const rows = Array.isArray(attr?.body) ? attr.body : [];
  return rows
    .filter(r => r && typeof r === 'object')
    .map((row) => ({
      capacidadNominal: String(row?.capacidadNominal ?? ''),
      potencialExtincion: String(row?.potencialExtincion ?? ''),
      checks: (row?.checks && typeof row.checks === 'object') ? row.checks : {},
      claseExtintor: String(row?.claseExtintor ?? ''),
      ubicacion: String(row?.ubicacion ?? ''),
      nroSello: String(row?.nroSello ?? ''),
      fechaVencimiento: String(row?.fechaVencimiento ?? ''),
    }));
}

function getExtintorCheckLabels(attr, extRow) {
  const conceptos = Array.isArray(attr?.conceptos) ? attr.conceptos : [];
  const fromConceptos = conceptos
    .slice(2)
    .map(c => String(c ?? '').trim())
    .filter(Boolean);

  const keys = Object.keys(extRow?.checks || {})
    .map(k => {
      const m = /^c_(\d+)$/.exec(String(k));
      return m ? Number(m[1]) : -1;
    })
    .filter(n => Number.isInteger(n) && n >= 0);

  const checkCountByData = keys.length ? Math.max(...keys) + 1 : EXTINTOR_DEFAULT_CHECK_LABELS.length;
  const base = fromConceptos.length >= checkCountByData
    ? fromConceptos
    : EXTINTOR_DEFAULT_CHECK_LABELS;

  return base.slice(0, checkCountByData);
}

function getExtintorCheckValue(extRow, idx) {
  return normalizeExtintorCheck(extRow?.checks?.[`c_${idx}`]);
}

function getEppRowsForPrint(attr) {
  const rows = Array.isArray(attr?.body) ? attr.body : [];
  return rows
    .filter(r => r && typeof r === 'object')
    .map((row) => ({
      nombre: String(row?.nombre ?? ''),
      cargo: String(row?.cargo ?? ''),
      observacionGeneral: String(row?.observacionGeneral ?? ''),
      items: Array.isArray(row?.items)
        ? row.items.map((it) => ({
            label: String(it?.label ?? ''),
            estado: String(it?.estado ?? ''),
          }))
        : [],
      galeria: Array.isArray(row?.galeria) ? row.galeria : [],
    }));
}

function getEppStateLabel(v) {
  const raw = String(v ?? '').trim().toLowerCase();
  if (!raw) return '';
  if (raw === 'b' || raw === 'bueno') return 'B';
  if (raw === 'm' || raw === 'malo') return 'M';
  if (raw === 'na' || raw === 'n/a') return 'N/A';
  return String(v ?? '').trim().toUpperCase();
}

function getBanosBlocksForPrint(attr) {
  const blocks = Array.isArray(attr?.blocks) ? attr.blocks : [];
  return blocks
    .filter(b => b && typeof b === 'object')
    .map((block) => ({
      title: String(block?.title ?? ''),
      items: Array.isArray(block?.items)
        ? block.items.map((item, idx) => ({
            numero: item?.numero ?? (idx + 1),
            pregunta: String(item?.pregunta ?? ''),
            estado: String(item?.estado ?? ''),
            observacion: String(item?.observacion ?? ''),
            fechaCorreccion: String(item?.fechaCorreccion ?? ''),
          }))
        : [],
    }));
}

function getBanosStateLabel(v) {
  const raw = String(v ?? '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'N/A' || raw === 'NA') return 'NA';
  if (raw === 'SI' || raw === 'SÍ') return 'SI';
  if (raw === 'NO') return 'NO';
  return raw;
}

function getAtsBlocksForPrint(attr) {
  const blocks = Array.isArray(attr?.blocks) ? attr.blocks : [];
  return blocks
    .filter(b => b && typeof b === 'object')
    .map((block) => ({
      title: String(block?.title ?? ''),
      items: Array.isArray(block?.items)
        ? block.items.map((item, idx) => ({
            numero: item?.numero ?? (idx + 1),
            label: String(item?.label ?? item?.pregunta ?? ''),
            tick: Boolean(item?.tick),
          }))
        : [],
    }));
}

function getAtsTickLabel(v) {
  return v ? 'SI' : 'NO';
}

function getAtsTareaRowsForPrint(attr) {
  const rows = Array.isArray(attr?.body) ? attr.body : [];
  return rows
    .filter(r => r && typeof r === 'object')
    .map((row) => {
      const peligrosRaw = Array.isArray(row?.peligros) ? row.peligros : [];
      const peligrosDetalle = peligrosRaw
        .filter(p => p && typeof p === 'object')
        .map((p) => ({
          peligro: String(p?.peligro ?? ''),
          riesgos: Array.isArray(p?.riesgos)
            ? p.riesgos
                .map(r => (typeof r === 'string' ? r : String(r?.riesgo ?? '')))
                .map(v => v.trim())
                .filter(Boolean)
            : [],
        }))
        .filter(p => p.peligro || p.riesgos.length);

      if (!peligrosDetalle.length) {
        const peligroLegacy = String(row?.peligro ?? '').trim();
        const riesgoLegacy = String(row?.riesgo ?? '').trim();
        if (peligroLegacy || riesgoLegacy) {
          peligrosDetalle.push({
            peligro: peligroLegacy,
            riesgos: riesgoLegacy ? [riesgoLegacy] : [],
          });
        }
      }

      return {
        tareaEtapa: String(row?.tareaEtapa ?? ''),
        peligro: String(row?.peligro ?? ''),
        riesgo: String(row?.riesgo ?? ''),
        peligrosDetalle,
        po: String(row?.po ?? ''),
        cp: String(row?.cp ?? ''),
        ponderacion: String(row?.ponderacion ?? ''),
        medidasControl: String(row?.medidasControl ?? ''),
      };
    });
}

function normalizeCondSegType(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function isCondicionesSeguridadType(type) {
  const t = normalizeCondSegType(type);
  return [
    'condicionesseguridadtrabajo',
    'condiciones seguridad trabajo',
    'condiciones de seguridad en trabajos',
    'cond seg trabajo',
    'condicionesseguridadentrabajos',
    'condiciones seguridad en trabajos',
  ].includes(t);
}

function splitCondSegTitle(rawTitle) {
  const title = String(rawTitle ?? '').trim();
  const m = title.match(/^(.*?)\s-\s(.+)$/);
  if (!m) return { sectionTitle: '', title };
  return {
    sectionTitle: String(m[1] ?? '').trim(),
    title: String(m[2] ?? '').trim(),
  };
}

function getCondicionesSeguridadGroupsForPrint(attr) {
  const blocks = Array.isArray(attr?.blocks) ? attr.blocks : [];
  const groupTitle = String(attr?.groupTitle ?? attr?.label ?? 'CONDICIONES DE SEGURIDAD').trim();

  const normalizedBlocks = blocks.map((block) => {
    const split = splitCondSegTitle(block?.title);
    const aplicaRaw = String(block?.aplica ?? '').trim().toLowerCase();
    const aplicaLabel = aplicaRaw === 'no_aplica'
      ? 'No aplica'
      : (aplicaRaw === 'aplica' ? 'Aplica' : 'Sin estado');

    const items = (Array.isArray(block?.items) ? block.items : []).map((item) => ({
      codigo: String(item?.codigo ?? '').trim(),
      label: String(item?.label ?? '').trim(),
      estado: String(item?.estado ?? '').trim().toUpperCase(),
      severidad: String(item?.severidad ?? '').trim().toUpperCase(),
      observacion: String(item?.observacion ?? '').trim(),
    }));

    return {
      sectionTitle: split.sectionTitle,
      title: split.title,
      infoText: String(block?.infoText ?? block?.descripcion ?? '').trim(),
      aplicaLabel,
      items,
    };
  });

  return [{ groupTitle, blocks: normalizedBlocks }];
}

const EXT_FIXED_ROWS = [
  'Estado enchufe macho',
  'Estado enchufe hembra',
  'Estado y continuidad del cable (cordón y conductores)',
  'Protección a tierra',
];

function getExtensionNumber(row, idx) {
  return row?.numeroExtension
    ?? row?.extensionNumero
    ?? row?.nroExtension
    ?? row?.extension
    ?? row?.numero
    ?? row?.nro
    ?? idx + 1;
}

function getExtensionGroups(attr) {
  const raw = getSpecialRows(attr);
  if (!raw.length) {
    return [{ numero: 1, rows: EXT_FIXED_ROWS.map(label => ({ label, data: null })), resultado: '' }];
  }

  // Si vienen grupos explícitos con items/body/checkBoby
  const nestedGroups = raw
    .filter(r => Array.isArray(r?.items) || Array.isArray(r?.body) || Array.isArray(r?.checkBoby))
    .map((g, i) => {
      const items = g.items ?? g.body ?? g.checkBoby ?? [];
      const rows = items.length
        ? items.map(it => ({ label: getSpecialItemLabel(it) || '', data: it }))
        : EXT_FIXED_ROWS.map(label => ({ label, data: null }));
      return {
        numero: getExtensionNumber(g, i),
        rows,
        resultado: normalizeVibroResultado(g.resultado ?? g.estado ?? g.value ?? g.default),
      };
    });
  if (nestedGroups.length) return nestedGroups;

  // Si vienen items planos con número de extensión
  const buckets = {};
  raw.forEach((r, i) => {
    const n = String(getExtensionNumber(r, i));
    if (!buckets[n]) buckets[n] = [];
    buckets[n].push(r);
  });

  return Object.entries(buckets).map(([numero, items]) => {
    const rows = EXT_FIXED_ROWS.map(label => {
      const hit = items.find(it => normalizeIlumLabel(getSpecialItemLabel(it)) === normalizeIlumLabel(label)) || null;
      return { label, data: hit };
    });
    const anyResult = items.find(it => normalizeVibroResultado(it?.resultado ?? it?.estado ?? it?.value ?? it?.default));
    return {
      numero,
      rows,
      resultado: normalizeVibroResultado(anyResult?.resultado ?? anyResult?.estado ?? anyResult?.value ?? anyResult?.default),
    };
  });
}

function getSpecialItemLabel(item) {
  if (!item || typeof item !== 'object') return '';
  return item.label ?? item.item ?? item.elemento ?? item.descripcion ?? '';
}

function getSpecialObs(item) {
  if (!item || typeof item !== 'object') return '';
  return item.obs ?? item.observacion ?? item.observaciones ?? '';
}

function isTruthyDayValue(v) {
  if (v === true || v === 1) return true;
  const s = String(v ?? '').trim().toLowerCase();
  return ['x', 'si', 's', '1', 'true', 'ok'].includes(s);
}

function hasDayMark(item, key) {
  if (!item || typeof item !== 'object') return false;
  const days = item.days ?? item.dias ?? item.dia ?? null;

  if (days && typeof days === 'object' && !Array.isArray(days)) {
    const map = {
      l: ['l', 'lun', 'lunes'],
      ma: ['ma', 'mar', 'martes', 'm'],
      mi: ['mi', 'mie', 'miercoles'],
      j: ['j', 'ju', 'jue', 'jueves'],
      v: ['v', 'vi', 'vie', 'viernes'],
    };
    const aliases = map[key] || [key];
    return aliases.some(a => isTruthyDayValue(days[a]));
  }

  if (Array.isArray(days)) {
    return days.map(d => String(d).toLowerCase()).includes(key);
  }

  return isTruthyDayValue(item?.[key]);
}

function getRepairDate(item) {
  if (!item || typeof item !== 'object') return '';
  const raw = item.fecha_reparacion
    ?? item.fechaReparacion
    ?? item.fecha
    ?? item.repairDate
    ?? '';
  return formatDate(raw) || String(raw || '');
}

function getVibroSection(item) {
  if (!item || typeof item !== 'object') return '';
  return String(item.seccion ?? item.section ?? item.grupo ?? item.group ?? item.categoria ?? item.category ?? '')
    .trim()
    .toLowerCase();
}

function getVibroEmpresa(attr) {
  if (!attr || typeof attr !== 'object') return '';
  return attr.empresa ?? attr.company ?? attr.nombreEmpresa ?? '';
}

function getVibroEquipoRows(attr) {
  const rows = getSpecialRows(attr);
  const withSection = rows.filter(r => {
    const s = getVibroSection(r);
    return s.includes('equipo');
  });
  if (withSection.length) return withSection;
  return rows.slice(0, 9);
}

function getVibroOtrosRows(attr) {
  const rows = getSpecialRows(attr);
  const withSection = rows.filter(r => {
    const s = getVibroSection(r);
    return s.includes('otro');
  });
  if (withSection.length) return withSection;
  return rows.slice(9);
}

function getVibroItemText(item, idx) {
  const text = getSpecialItemLabel(item) || '';
  const n = Number(idx) + 1;
  return text ? `${n}  ${text}` : `${n}`;
}

function getBetoneraEquipoRows(attr) {
  const rows = getSpecialRows(attr);
  const withSection = rows.filter(r => {
    const s = getVibroSection(r);
    return s.includes('equipo');
  });
  if (withSection.length) return withSection;
  return rows.slice(0, 9);
}

function getBetoneraOtrosRows(attr) {
  const rows = getSpecialRows(attr);
  const withSection = rows.filter(r => {
    const s = getVibroSection(r);
    return s.includes('otro');
  });
  if (withSection.length) return withSection;
  return rows.slice(9);
}

function normalizeVibroResultado(value) {
  if (value == null) return '';
  if (value === true) return 'aprobada';
  if (value === false) return 'reprobada';

  const s = String(value).trim().toLowerCase();
  if (!s) return '';

  if (s.includes('reprob')) return 'reprobada';
  if (s.includes('aprob')) return 'aprobada';
  if (['ok', 'cumple', 'si', '1', 'true'].includes(s)) return 'aprobada';
  if (['no', '0', 'false'].includes(s)) return 'reprobada';

  return '';
}

function getBetoneraResultado(attr) {
  return getVibroResultado(attr);
}

function getMartilloResultado(attr) {
  return getVibroResultado(attr);
}

function getMartilloObs(attr) {
  if (!attr || typeof attr !== 'object') return '';
  return attr.observaciones ?? attr.obs ?? attr.observacion ?? '';
}

function isIlumSectionRow(item) {
  if (!item || typeof item !== 'object') return false;
  if (item.section === true || item.isSection === true || item.header === true) return true;
  const t = String(item.type ?? '').toLowerCase();
  if (t === 'section' || t === 'header' || t === 'title') return true;

  const label = String(getSpecialItemLabel(item) || '').trim();
  if (!label) return false;
  const hasDays = hasDayMark(item, 'l') || hasDayMark(item, 'ma') || hasDayMark(item, 'mi') || hasDayMark(item, 'j') || hasDayMark(item, 'v');
  const hasObs = String(getSpecialObs(item) || '').trim().length > 0;
  const upper = label === label.toUpperCase();
  return upper && !hasDays && !hasObs;
}

const ILUM_FIXED_ROWS = [
  { label: 'MOTOR', isSection: true },
  { label: 'FILTRACIONES' },
  { label: 'ALTERNADOR' },
  { label: 'MOTOR DE PARTIDA' },
  { label: 'RADIADOR / ANTICONGELANTE' },
  { label: 'ESTADO DE CORREA' },
  { label: 'RUIDOS ANORMALES' },
  { label: 'FILTRO DE AIRE' },
  { label: 'PÉRDIDAS DE PETRÓLEO' },
  { label: 'TUBO ESCAPE' },
  { label: 'LUMINARIA Y SISTEMA ELÉCTRICO', isSection: true },
  { label: 'INSTRUMENTOS' },
  { label: 'CABLEADO Y CONEXIONES' },
  { label: 'BATERIA' },
  { label: 'UNIDAD GENERADORA' },
  { label: 'FOCOS' },
  { label: 'CAJA DISTRIBUIDORA DE LA TORRE' },
  { label: 'CABLES ALIMENTACION FOCOS' },
  { label: 'LUCES PILOTO' },
  { label: 'CHASSIS', isSection: true },
  { label: 'PUERTAS' },
  { label: 'TECHO' },
  { label: 'PINTURA' },
  { label: 'NEUMATICOS' },
  { label: 'BARRA DE TIRO' },
  { label: 'ESTABILIZADORES' },
  { label: 'LEVANTE DE TORRE' },
  { label: 'SOPORTES FOCOS' },
  { label: 'SEGUROS' },
];

const DISP_FIXED_ROWS = [
  { code: '1.1', label: 'Letrero con leyenda Agua Potable' },
  { code: '1.2', label: 'Llave exterior para evitar contaminación' },
  { code: '1.3', label: 'Vasos desechables para un solo uso' },
  { code: '1.4', label: 'Basurero para botar vasos usados' },
  { code: '1.5', label: 'Mantenimiento diario de dispensadores' },
  { code: '1.6', label: 'Ubicación adecuada del dispensador' },
  { code: '1.7', label: 'Persona responsable del dispensador' },
  { code: '1.8', label: 'Plano de ubicación y distribución' },
  { code: '1.9', label: 'Otros' },
];

const MANUAL_TOOLS_ROWS_1 = [
  { label: 'CHUZOS', highlight: true },
  { label: 'CARRETILLAS', highlight: true },
  { label: 'MARTILLO', highlight: true },
  { label: 'MAZO', highlight: true },
  { label: 'CINCELES', highlight: true },
  { label: 'HOJAS DE LOS SERRUCHOS', highlight: true },
  { label: 'LIMAS', highlight: true },
  { label: 'ALICATES', highlight: true },
  { label: 'PALAS', highlight: true },
  { label: 'CUCHILLOS CARTONEROS', highlight: true },
  { label: 'LIENZA', highlight: true },
  { label: 'PICOTAS', highlight: true },
  { label: 'DESTORNILLADORES' },
  { label: 'LLAVES PUNTA CORONA' },
  { label: 'LLAVE ALLEN' },
  { label: 'LLAVE STILSON' },
  { label: 'DADOS' },
  { label: 'LLAVE PICO DE LORO' },
  { label: 'PELA CABLES' },
  { label: 'LLAVES PUNTA ESTRELLA' },
  { label: 'HOJAS DE CIERRAS' },
  { label: 'CUCHILLOS CARTONEROS' },
];

const MANUAL_TOOLS_ROWS_2 = [
  { label: 'DESTORNILLADORES (PRESENTAN DESGASTE)' },
  { label: 'LLAVES PUNTA CORONA' },
  { label: 'LLAVE ALLEN' },
  { label: 'LLAVE STILSON' },
  { label: 'DADOS' },
  { label: 'LLAVE PICO DE LORO' },
  { label: 'LLAVES DE CADENA' },
  { label: 'ALICATES' },
  { label: 'LLAVE AJUSTABLE' },
];

const TRUCK_FIXED_ROWS = [
  { label: 'DOCUMENTACIÓN', isSection: true },
  { label: 'Licencia Conducir' },
  { label: 'Revisión Técnica' },
  { label: 'Seguro Obligatorio' },
  { label: 'Control de Gases' },
  { label: 'Permiso de Circulación' },
  { label: 'HOJA DE VIDA', isSection: true },
  { label: 'Fecha Última Mantención Preventiva' },
  { label: 'Kilometraje' },
  { label: 'FUNCIONAMIENTO', isSection: true },
  { label: 'NIVEL ACEITE DE MOTOR' },
  { label: 'NIVEL ACEITE HIDRÁULICO' },
  { label: 'PASADORES DE LOS CILINDROS EN BUEN' },
  { label: 'RELOJES DE TEMPERATURA, ACEITE Y PETRÓLEO EN BUEN ESTADO' },
  { label: 'NIVEL ACEITE TRANSMISIÓN' },
  { label: 'NIVEL DE REFRIGERANTE' },
  { label: 'LUCES (altas, bajas, estacionamiento, etc.)' },
  { label: 'CABINAS BUEN ESTADO' },
  { label: 'FRENOS (estacionamiento, servicio, etc.)' },
  { label: 'VIDRIOS (parabrisas, puertas, etc.)' },
  { label: 'FUGAS DE ACEITE (hidráulico, motor, etc.)' },
  { label: 'FUGAS DE AGUA (radiador, mangueras, etc.)' },
  { label: 'NEUMÁTICOS (delanteros, traseros, repuesto)' },
  { label: 'DIRECCIÓN' },
  { label: 'TRANSMISIÓN' },
  { label: 'ACCESORIOS', isSection: true },
  { label: 'GATA Y LLAVE DE RUEDA' },
  { label: 'BOCINA' },
  { label: 'ALARMA DE RETROCESO' },
  { label: 'LIMPIA PARABRISAS' },
  { label: 'ESPEJOS RETROVISORES' },
  { label: 'SISTEMA DE VENTILACIÓN' },
  { label: 'TRIÁNGULOS' },
  { label: 'EXTINTOR' },
  { label: 'BOTIQUÍN' },
  { label: 'CINTURÓN DE SEGURIDAD' },
  { label: 'CONOS' },
];

function normalizeIlumLabel(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function findIlumDataRow(attr, fixedLabel) {
  const rows = getSpecialRows(attr);
  const target = normalizeIlumLabel(fixedLabel);
  return rows.find(r => normalizeIlumLabel(getSpecialItemLabel(r)) === target) || null;
}

function getIlumRowsForPrint(attr) {
  return ILUM_FIXED_ROWS.map(row => ({
    ...row,
    data: row.isSection ? null : findIlumDataRow(attr, row.label),
  }));
}

function findDispDataRow(attr, fixedLabel, fixedCode) {
  const rows = getSpecialRows(attr);
  const target = normalizeIlumLabel(fixedLabel);
  return rows.find(r => {
    const byLabel = normalizeIlumLabel(getSpecialItemLabel(r)) === target;
    const byCode = String(r?.code ?? r?.codigo ?? '').trim() === fixedCode;
    return byLabel || byCode;
  }) || null;
}

function getDispRowsForPrint(attr) {
  return DISP_FIXED_ROWS.map(row => ({
    ...row,
    data: findDispDataRow(attr, row.label, row.code),
  }));
}

function getDispObs(attr) {
  if (!attr || typeof attr !== 'object') return '';
  return attr.observaciones ?? attr.obs ?? attr.observacion ?? '';
}

function findManualToolsRow(attr, fixedLabel) {
  const rows = getSpecialRows(attr);
  const target = normalizeIlumLabel(fixedLabel);
  return rows.find(r => normalizeIlumLabel(getSpecialItemLabel(r)) === target) || null;
}

function getManualToolsRows1(attr) {
  return MANUAL_TOOLS_ROWS_1.map(r => ({
    ...r,
    data: findManualToolsRow(attr, r.label),
  }));
}

function getManualToolsRows2(attr) {
  return MANUAL_TOOLS_ROWS_2.map(r => ({
    ...r,
    data: findManualToolsRow(attr, r.label),
  }));
}

function isTruckInspectionAttr(attr) {
  if (!attr || typeof attr !== 'object') return false;
  const t = String(attr.type ?? '').toLowerCase();
  if (['inspeccioncamion', 'checkinspeccioncamion', 'checklistcamion', 'camion'].includes(t)) return true;
  const l = normalizeIlumLabel(attr.label ?? '');
  return l.includes('camion') || l.includes('camión');
}

function normalizeTruckLabel(s) {
  return normalizeIlumLabel(s).replace(/[^a-z0-9 ]/g, '');
}

function findTruckRow(attr, fixedLabel) {
  const rows = getSpecialRows(attr);
  const target = normalizeTruckLabel(fixedLabel);
  return rows.find(r => {
    const lbl = normalizeTruckLabel(getSpecialItemLabel(r));
    return lbl === target || lbl.includes(target) || target.includes(lbl);
  }) || null;
}

function getTruckDataRows(attr) {
  return getSpecialRows(attr).filter(r => {
    const lbl = normalizeTruckLabel(getSpecialItemLabel(r));
    if (!lbl) return false;
    return !['documentacion', 'hoja de vida', 'funcionamiento', 'accesorios'].includes(lbl);
  });
}

function getTruckRowsForPrint(attr) {
  const dataRows = getTruckDataRows(attr);
  const used = new Set();

  return TRUCK_FIXED_ROWS.map(r => {
    if (r.isSection) return { ...r, data: null };

    const byLabel = findTruckRow(attr, r.label);
    if (byLabel) {
      used.add(byLabel);
      return { ...r, data: byLabel };
    }

    const byIndex = dataRows.find(x => !used.has(x)) || null;
    if (byIndex) used.add(byIndex);
    return { ...r, data: byIndex };
  });
}

function flattenEntries(obj, prefix = '') {
  if (!obj || typeof obj !== 'object') return [];
  const out = [];
  Object.entries(obj).forEach(([k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenEntries(v, key));
    } else if (Array.isArray(v)) {
      v.forEach((iv, i) => {
        if (iv && typeof iv === 'object') out.push(...flattenEntries(iv, `${key}.${i}`));
        else out.push([`${key}.${i}`, iv]);
      });
    } else {
      out.push([key, v]);
    }
  });
  return out;
}

function getTruckWeekMark(item, week, option) {
  if (!item || typeof item !== 'object') return '';

  const wk = item[`semana${week}`] ?? item[`week${week}`] ?? item[`w${week}`] ?? item?.weeks?.[week - 1] ?? null;
  if (wk && typeof wk === 'object') {
    if (isTruthyDayValue(wk[option])) return 'X';
    return '';
  }

  const key = `${week}_${option}`;
  if (isTruthyDayValue(item[key])) return 'X';

  const compact = option === 'na' ? ['na', 'n/a'] : [option];
  if (compact.some(op => isTruthyDayValue(item?.[`semana${week}_${op}`] ?? item?.[`week${week}_${op}`] ?? item?.[`w${week}_${op}`]))) {
    return 'X';
  }

  const entries = flattenEntries(item);
  const weekTokens = [`semana${week}`, `week${week}`, `w${week}`, `${week}ra`, `${week}ta`, `${week}`];
  const optionTokens = option === 'na' ? ['na', 'n/a'] : [option];

  for (const [k, v] of entries) {
    const keyNorm = normalizeIlumLabel(k);
    const hasWeek = weekTokens.some(t => keyNorm.includes(t));
    if (!hasWeek) continue;

    const hasOptionInKey = optionTokens.some(t => keyNorm.includes(t));
    if (hasOptionInKey && isTruthyDayValue(v)) return 'X';

    const val = normalizeIlumLabel(v);
    if (optionTokens.some(t => val === t || val.endsWith(` ${t}`))) return 'X';
  }

  const val = String(item.valor ?? item.value ?? '').toLowerCase();
  const op = String(option).toLowerCase();
  if (val && val === op) return 'X';

  return '';
}

function getVibroResultado(attr) {
  if (!attr || typeof attr !== 'object') return '';

  if (attr.aprobada === true) return 'aprobada';
  if (attr.reprobada === true) return 'reprobada';

  const candidates = [
    attr.resultado,
    attr.estado,
    attr.result,
    attr.default,
    attr.value,
    attr.status,
    attr.calificacion,
    attr.aprobacion,
    attr.selected,
    attr.footer?.resultado,
    attr.footer?.estado,
  ];

  for (const c of candidates) {
    const normalized = normalizeVibroResultado(c);
    if (normalized) return normalized;
  }

  const rows = getSpecialRows(attr);
  const rowMatch = rows.find(r => {
    const lbl = getSpecialItemLabel(r).toLowerCase();
    return lbl.includes('resultado') || lbl.includes('aprob');
  });
  if (rowMatch) {
    const normalized = normalizeVibroResultado(
      rowMatch.resultado ?? rowMatch.estado ?? rowMatch.value ?? rowMatch.default
    );
    if (normalized) return normalized;
  }

  return '';
}

const PRINT_KNOWN_TYPES = new Set([
  'checkListAlzaHombreDmh',
  'checkListGruaHorquillaDmh',
  'checkListElementosVisibilidadDmh',
  'checkListCamionetaDmh',
  'checkListCamionPlumaDmh',
  'checkListCamionGruaDmh',
  'checkListCamionRamplaDmh',
  'checkListExtintorCdch',
  'checklistExtintorCdch',
  'CHECK LIST EXTINTOR CDCH',
  'CHECK LIST EXTINTOR',
  'checkListGrilleteCdch',
  'checklistGrilleteCdch',
  'CHECK LIST GRILLETE CDCH',
  'CHECK LIST GRILLETE',
  'checkListRetractilCdch',
  'checklistRetractilCdch',
  'CHECK LIST RETRACTIL CDCH',
  'CHECK LIST RETRACTIL',
  'fileUpload',
  'comboBox',
  'photo',
  'photoCheck',
  'photoCapture',
  'checkList',
  'geoLocation',
  'checkListObservacionConductual',
  'textField',
  'textArea',
  'decimal',
  'newLine',
  'labelLine',
  'labelLineH1',
  'labelLineH2',
  'labelLineH3',
  'labelLineH4',
  'labelLineH5',
  'verDoc',
  'matrizMAObsyRecomenaciones',
  'resgistroAdd',
  'registroEventos',
  'dateHourPicker',
  'datePicker',
  'checkListTecles',
  'ingresoZanja',
  'chequeoExtensionElectrica',
  'checkMonofasicoTrifasico',
  'vibropison',
  'chequeoSeguridadBetonera',
  'checkeoMartilloDemoledor',
  'checkEquiposIluminacion',
  'checkDispensadorAguaPotable',
  'checkListHerramientasManuales',
  'checkExtintores',
  'checkEpp',
  'checkEPP',
  'inspeccionEpp',
  'inspeccionEPP',
  'checkBanosInstalaciones',
  'checkBanos',
  'CHECK BANOS INSTALACIONES',
  'atsToggles',
  'atsBloquesToggle',
  'ATS BLOQUES TOGGLE',
  'tarea',
  'tareaAts',
  'TAREA ATS',
  'condicionesSeguridadTrabajo',
  'condSegTrabajo',
  'CONDICIONES SEGURIDAD TRABAJO',
  'inspeccionCamion',
  'checkInspeccionCamion',
  'checkListCamion',
  'camion',
]);

function isUnhandledPrintableAttr(attr) {
  if (!attr?.type) return false;
  if (isTruckInspectionAttr(attr)) return false;
  return !PRINT_KNOWN_TYPES.has(attr.type) && !isMatrixLike(attr);
}

function getGenericRows(attr) {
  const raw = Array.isArray(attr?.body)
    ? attr.body
    : (Array.isArray(attr?.checkBoby) ? attr.checkBoby : []);

  return raw.map(r => {
    if (r && typeof r === 'object' && !Array.isArray(r)) return r;
    return { valor: r };
  });
}

function getGenericHeaders(attr) {
  const rows = getGenericRows(attr);
  if (!rows.length) return ['valor'];
  const keys = Array.from(new Set(rows.flatMap(r => Object.keys(r || {}))));
  return keys.length ? keys : ['valor'];
}

function isPhotoArray(v) {
  return Array.isArray(v) && v.some(x => !!resolveImgSrc(x));
}

function formatGenericCell(v) {
  if (v == null || v === '') return '—';
  if (Array.isArray(v)) {
    if (!v.length) return '—';
    if (isPhotoArray(v)) return '';
    return JSON.stringify(v);
  }
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

const isPPD = computed(() => {
  const s0 = surveyDetailStore.surveyDetail?.[0];
  if (!s0) return false;

  // Ajusta las condiciones que quieras
  return (
    s0.codi_template_srv === 'PPD' ||
    s0.name_template_srv === 'Parte Producción Diaria' ||
    s0.codi_tipo_srv === 'PP'
  );
});

// body_exec puede venir string o objeto
const rawBodyExec = computed(() => {
  const s0 = surveyDetailStore.surveyDetail?.[0];
  if (!s0) return null;

  const body = s0.body_exec;
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch (e) {
      console.error('Error parseando body_exec PPD', e);
      return null;
    }
  }
  return body || null;
});

// lista de tareas PPD
const tasksPPD = computed(() => {
  const body = rawBodyExec.value;
  if (body && Array.isArray(body.task)) return body.task;
  if (Array.isArray(body)) return body; // fallback por si algún día viene así
  return [];
});

// agrupar por cuadrilla y calcular totales
const cuadrillasPPD = computed(() => {
  const map = {};

  tasksPPD.value.forEach(t => {
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
});

// Tipos que quieres compactar como una fila (cabecera única + valores)
const T_TEXTLIKE = ['textField', 'textArea', 'datePicker', 'dateHourPicker'];
const INLINE_PAIR_TYPES = new Set([
  'textField',
  'textArea',
  'datePicker',
  'dateHourPicker',
  'decimal',
  'number',
  'comboBox',
  'select',
]);
const INLINE_EXCLUDED_TYPES = new Set([
  'fileUpload',
  'photo',
  'photoCheck',
  'photoCapture',
  'checkList',
  'checkExtintores',
  'checkEpp',
  'checkEPP',
  'inspeccionEpp',
  'inspeccionEPP',
  'checkBanosInstalaciones',
  'checkBanos',
  'CHECK BANOS INSTALACIONES',
  'atsToggles',
  'atsBloquesToggle',
  'ATS BLOQUES TOGGLE',
  'tarea',
  'tareaAts',
  'TAREA ATS',
  'condicionesSeguridadTrabajo',
  'condSegTrabajo',
  'CONDICIONES SEGURIDAD TRABAJO',
  'geoLocation',
  'newLine',
  'labelLine',
  'labelLineH1',
  'labelLineH2',
  'labelLineH3',
  'labelLineH4',
  'labelLineH5',
  'verDoc',
  'signature'
]);

// Únicos preservando orden (para strings)
function uniqStrings(arr) {
  const seen = new Set();
  const out = [];
  for (const s of arr) {
    const key = String(s ?? '');
    if (!seen.has(key)) { seen.add(key); out.push(key); }
  }
  return out;
}

// ====== TEXTLIKE ======
function headersTextLike(segmento) {
  const attrs = (segmento.attributes || []).filter(a => T_TEXTLIKE.includes(a.type));
  return uniqStrings(attrs.map(a => a.label ?? ''));
}
function valuesTextLike(segmento, headers) {
  return headers.map(h => {
    const a = (segmento.attributes || []).find(x => T_TEXTLIKE.includes(x.type) && (x.label ?? '') === h);
    return a?.default ?? '';
  });
}

// ====== COMBOBOX ======
function headersCombo(segmento) {
  const combos = (segmento.attributes || []).filter(a => a.type === 'comboBox');
  return uniqStrings(combos.map(a => a.values?.quest ?? ''));
}
function displayComboValue(attr) {
  const sel = attr?.values?.selected ?? attr?.default ?? '';
  const opts = (attr?.values?.options ?? []).map(o => ({
    value: o.value ?? o.id,
    label: o.label ?? o.value ?? o.id
  }));
  const found = opts.find(o => o.value === sel)?.label;
  return found ?? sel ?? '';
}
function valuesCombo(segmento, headers) {
  return headers.map(h => {
    const a = (segmento.attributes || []).find(x => x.type === 'comboBox' && (x.values?.quest ?? '') === h);
    return displayComboValue(a);
  });
}
function comboHeaderCells(segmento) {
  const count = (segmento?.attributes || []).filter(a => a.type === 'comboBox').length;
  // Con 1 combo: 2 headers, cada uno ocupará colspan=2 (total 4 columnas)
  // Con 2+ combos: 4 headers normales (1 columna cada uno)
  return count <= 1
    ? [{ text: 'Identificador', span: 2 }, { text: 'Valor', span: 2 }]
    : [
      { text: 'Identificador', span: 1 },
      { text: 'Valor', span: 1 },
      { text: 'Identificador', span: 1 },
      { text: 'Valor', span: 1 },
    ];
}

// ====== FILE UPLOAD (columna única o dos columnas si quieres OBS) ======
function headerFileUpload() { return ['Documento']; } // o ['Documento','Observación']
function valuesFileUpload(segmento) {
  const files = (segmento.attributes || []).filter(a => a.type === 'fileUpload').flatMap(a => a.archivos || []);
  // Une por saltos de línea; puedes renderizar como <ul> si prefieres
  return [files.map(f => (f.nombre || f.name || '')).filter(Boolean).join('\n')];
  // Si quisieras Observación también:
  // const obs = (segmento.attributes || []).filter(a => a.type === 'fileUpload').map(a => a.obs || '').filter(Boolean).join('\n');
  // return [docList, obs];
}

// ====== GEO ======
function headerGeo() { return ['Latitud', 'Longitud']; }
function valuesGeo(segmento) {
  const geo = (segmento.attributes || []).find(a => a.type === 'geoLocation');
  return [geo?.default?.lat ?? '', geo?.default?.lng ?? ''];
}

function getInlineAttrLabel(attr) {
  const direct = [
    attr?.label,
    attr?.title,
    attr?.titulo,
    attr?.values?.quest,
    attr?.quest,
    attr?.text,
    attr?.name,
    attr?.item,
    attr?.id,
  ].find(v => String(v ?? '').trim() !== '');
  if (direct != null) return String(direct).trim();

  const scan = (obj) => {
    if (!obj || typeof obj !== 'object') return '';
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== 'string' && typeof v !== 'number') continue;
      const key = String(k).toLowerCase();
      const val = String(v).trim();
      if (!val) continue;
      if (/(label|title|titulo|quest|name|item|id)/.test(key)) return val;
    }
    return '';
  };

  return scan(attr?.values) || scan(attr) || '';
}

function getInlineAttrsForPrint(segmento) {
  const attrs = segmento?.attributes || [];
  const filtered = attrs.filter(attr => {
    if (!attr || typeof attr !== 'object') return false;
    if (isMatrixLike(attr) || isTruckInspectionAttr(attr)) return false;
    if (INLINE_EXCLUDED_TYPES.has(attr.type)) return false;
    if (INLINE_PAIR_TYPES.has(attr.type)) return true;
    const label = String(getInlineAttrLabel(attr)).trim();
    const scalar = attr?.default ?? attr?.value ?? attr?.answer ?? attr?.selected ?? attr?.result ?? attr?.values?.selected;
    const hasScalar = ['string', 'number', 'boolean'].includes(typeof scalar);
    return label !== '' || hasScalar;
  });

  const segLabel = String(segmento?.label ?? '').toLowerCase();
  if (segLabel.includes('identificaci') && segLabel.includes('item')) {
    const norm = (s) => String(s ?? '')
      .toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

    const idxOperador = filtered.findIndex(a => norm(getInlineAttrLabel(a)).includes('OPERADOR GPS'));
    if (idxOperador >= 0) {
      const hasItemAfter = filtered
        .slice(idxOperador + 1)
        .some(a => norm(getInlineAttrLabel(a)) === 'ITEM');

      if (!hasItemAfter) {
        filtered.push({ type: 'textField', label: 'ITEM', default: '' });
      }
    }
  }

  return filtered;
}

function getStandaloneComboAttrs() {
  // comboBox/select se imprimen en el flujo inline para respetar orden original
  return [];
}

async function generarQRCodes(lista) {
  const items = Array.isArray(lista) ? lista : []; // fuerza array
  for (const item of items) {
    const qrFilename = item?.firma?.qrUrl;
    if (qrFilename) {
      const fullUrl = BASE_URL + qrFilename;
      try {
        const dataUrl = await QRCode.toDataURL(fullUrl);
        qrMap.value[qrFilename] = dataUrl;
        console.log('✅ QR generado para:', fullUrl);
      } catch (err) {
        console.error('❌ Error generando QR para:', fullUrl, err);
      }
    } else {
      console.log('⚠️ Firma sin qrUrl:', item);
    }
  }
}

// promedio de una columna del body (colIndex basado en tu layout)
function getColumnAverage(body, colIndex) {
  if (!Array.isArray(body)) return '';
  const nums = body
    .map(row => parseFloat(row?.[colIndex]?.value))
    .filter(v => !Number.isNaN(v));
  if (!nums.length) return '';
  const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
  return avg.toFixed(2); // ajusta decimales si quieres
}

// mapea el orden de celdas 'prom' a las columnas del body: a,b,c,cota => 2,3,4,5
const PROM_TO_BODY_COLS = [2, 3, 4, 5];

// calcula el índice ordinal (0,1,2,3,...) de una celda 'prom' recorriendo el footer
function getPromOrdinal(footer, targetRowIdx, targetCellIdx) {
  let count = 0;
  for (let r = 0; r <= targetRowIdx; r++) {
    const row = footer?.[r] || [];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (r === targetRowIdx && c === targetCellIdx) return count;
      if (cell?.cal === 'prom') count++;
    }
  }
  return count;
}

// dado (frIdx, fcIdx) devuelve el promedio que corresponde por orden
function getAverageByPromCell(attr, frIdx, fcIdx) {
  const footer = attr?.footer || [];
  const order = getPromOrdinal(footer, frIdx, fcIdx);  // 0->a, 1->b, 2->c, 3->cota
  const colIdx = PROM_TO_BODY_COLS[order];
  if (colIdx === undefined) return '';
  return getColumnAverage(attr?.body, colIdx);
}

async function getSurvey() {
  try {
    const sId = Number(idSurvey.value)
    if (sId >= 9001 && sId <= 9006) {
      const mockSurveysList = getMockSurveys()
      const mockSurvey = mockSurveysList.find(s => s.id_survey === sId)
      if (mockSurvey) {
        console.log("=================SURVEY Detail (MOCK) ========", mockSurvey);
        const data = [mockSurvey]
        surveys.value = data
        surveyDetailStore.surveyDetail = data
        imagenEmpresa.value = ''
        imagenEmpresaTransmac.value = ''
        user.value = {
          name_frst: 'Inspector',
          apellido_pat: 'Simulado',
          apellido_mat: ''
        }
        flowStepsActuales.value = []
        return
      }
    }

    const apiBase = apiAxios.defaults.baseURL || 'https://servidor.leanglobal.cl/lean-services-transmac-dev/api';
    const response = await axios.get(`${apiBase}/servicio/leanglobal/procesosSurveyDetail?id_survey=${idSurvey.value}`);
    console.log("=================SURVEY Detail ========", response.data);
    surveys.value = response.data;
    surveyDetailStore.surveyDetail = response.data;
    console.log("surveyDetail", surveyDetailStore.surveyDetail);
    if (surveyDetailStore.surveyDetail[0]?.name_empresa_cliente) {
      try {
        const responseObtenerEmpresa = await apiAxios.get("/servicio/leanglobal/obtenerEmpresas?name_empresa=" + encodeURIComponent(surveyDetailStore.surveyDetail[0].name_empresa_cliente));
        imagenEmpresa.value = responseObtenerEmpresa.data?.[0]?.logo_empresa || null;
      } catch (errEmp) {
        console.warn("⚠️ Error obteniendo logo empresa cliente:", errEmp);
      }
    }
    try {
      const responseObtenerTransmac = await apiAxios.get("/servicio/leanglobal/obtenerEmpresas?id_empresa=9");
      imagenEmpresaTransmac.value = responseObtenerTransmac.data?.[0]?.logo_empresa || null;
    } catch (errTrans) {
      console.warn("⚠️ Error obteniendo logo Transmac:", errTrans);
    }
    if (surveyDetailStore.surveyDetail[0]?.id_user) {
      try {
        const responseUser = await apiAxios.get("/servicio/leanglobal/obtenerUsuarios?id_user=" + surveyDetailStore.surveyDetail[0].id_user);
        user.value = responseUser.data?.[0] || {};
      } catch (errUser) {
        console.warn("⚠️ Error obteniendo usuario ejecutor:", errUser);
      }
    }

    // Obtener superior asignado si existe en los datos
    superiorUser.value = null
    const superiorId = getSuperiorDerivadoId(surveyDetailStore.surveyDetail[0])
    if (superiorId) {
      try {
        const responseSup = await apiAxios.get("/servicio/leanglobal/obtenerUsuarios?id_user=" + superiorId);
        superiorUser.value = responseSup.data[0] || null
      } catch (errSup) {
        console.warn('Error al obtener superior asignado:', errSup)
      }
    }

    await cargarEquiposProyectosMiembrosFES()
    await cargarEstructuraFirmasActual()
    await generarQRCodes(surveyDetailStore.surveyDetail[0]?.approval_exec)
    console.log(surveyDetailStore.surveyDetail[0])
  } catch (error) {
    console.error("Error al obtener survey:", error);
    throw error;
  }
}

function getSuperiorDerivadoId(survey) {
  const body = typeof survey?.body_exec === 'string'
    ? (() => { try { return JSON.parse(survey.body_exec); } catch { return {}; } })()
    : (survey?.body_exec || {})
  const segmentos = Array.isArray(body?.segmentos) ? body.segmentos : []
  for (const seg of segmentos) {
    const attrs = Array.isArray(seg.attributes) ? seg.attributes : []
    for (const a of attrs) {
      if (a.type === 'checkListObservacionConductual') {
        return a.datos?.superiorDerivado
      } else if (a.type === 'condicionesSeguridadTrabajo') {
        return a.superiorDerivado
      }
    }
  }
  return null
}

function getNombreSuperiorAsignado() {
  if (superiorUser.value) {
    return (superiorUser.value.name_frst || '') + ' ' + (superiorUser.value.apellido_pat || '')
  }
  const paso2 = flowStepsActuales.value.find(st => Number(st.flow_tmpl_step_orden) === 2)
  return paso2?.nombre_user || paso2?.nombre || 'Superior Responsable'
}

const getSegmentos = (survey) => {
  try {
    const body = typeof survey.body_exec === 'string'
      ? JSON.parse(survey.body_exec)
      : survey.body_exec;

    let segmentos = Array.isArray(body?.segmentos) ? body.segmentos : [];

    /*if (!segmentos.some(s => s.label === 'Segmento para Publicar Documentos')) {
      segmentos.push({
            "label": "Segmento para Publicar Documentos",
            "touch": true,
            "cantidad": "2",
            "posicion": "1",
            "attributes": [
                {
            "type": "verDoc",
            "label": "RIOHS.xlsx",
            "id_doc": 1549,
            "src": ""
        },
        {
            "type": "verDoc",
            "label": "Riesgos Vibraciones.xlsx",
            "id_doc": 1548,
            "src": ""
        },
        {
            "type": "verDoc",
            "label": "Riesgos TMERT.xlsx",
            "id_doc": 1547,
            "src": ""
        }
            ],
            "collapsible": false
        })
    }*/
    console.log(segmentos);

    processMatrizCheck(segmentos)

    return segmentos;
  } catch (error) {
    console.log(error);
    return [];
  }
};

function agruparPorTipoPares(lista) {
  const resultado = [];
  let i = 0;

  while (i < lista.length) {
    const actual = lista[i];
    const siguiente = lista[i + 1];
    resultado.push(siguiente ? [actual, siguiente] : [actual]);
    i += 2;
  }

  return resultado;
}

async function cargarEstructuraFirmasActual() {
  try {
    const idFlowSurvey = Number(surveyDetailStore.surveyDetail?.[0]?.id_flow || 0)
    let idFlow = idFlowSurvey

    if (!idFlow) {
      const { data } = await apiAxios.get(
        '/servicio/leanglobal/flujosAprobacion?fecha_desde=&fecha_hasta=&ts.id_empresa_cliente=&ts.id_proyecto='
      )
      const rows = Array.isArray(data?.datos) ? data.datos : []
      const row = rows.find(r => Number(r?.id_survey) === Number(idSurvey.value))
      idFlow = Number(row?.id_flow || 0)
    }

    if (!idFlow) {
      // Inyectar pasos virtuales para SST si no hay flujo físico en base de datos
      const idTemplate = Number(surveyDetailStore.surveyDetail?.[0]?.id_template || 0)
      if ([70, 80].includes(idTemplate)) {
        const creatorUser = user.value || {}
        const creatorName = (creatorUser.name_frst || '') + ' ' + (creatorUser.apellido_pat || '')
        const supName = superiorUser.value 
          ? ((superiorUser.value.name_frst || '') + ' ' + (superiorUser.value.apellido_pat || '')) 
          : 'Superior Responsable'
        
        flowStepsActuales.value = [
          {
            flow_tmpl_step_orden: 1,
            name_rol: 'Inspector / Ejecutor',
            nombre_user: creatorName || 'Ejecutor',
            estado: 'APROBADO'
          },
          {
            flow_tmpl_step_orden: 2,
            name_rol: 'Superior Cierre',
            nombre_user: supName,
            estado: surveyDetailStore.surveyDetail[0]?.estado_srv === 'APROBADO' ? 'APROBADO' : 'PENDIENTE'
          }
        ]
        return
      }
      flowStepsActuales.value = []
      return
    }

    const { data: steps } = await apiAxios.get(
      `/servicio/leanglobal/flujosAprobacionSteps?id_flow=${idFlow}`
    )
    flowStepsActuales.value = Array.isArray(steps)
      ? [...steps].sort(
        (a, b) =>
          Number(a?.flow_tmpl_step_orden ?? Number.MAX_SAFE_INTEGER) -
          Number(b?.flow_tmpl_step_orden ?? Number.MAX_SAFE_INTEGER)
      )
      : []
  } catch (e) {
    console.error('Error cargando estructura de firmas:', e)
    flowStepsActuales.value = []
  }
}

function esFirmaColectiva(step, firma) {
  if (step?.flag_equipo === true) return true

  const fuentes = [
    step?.name_rol,
    step?.flow_tmpl_step_name,
    step?.rol,
    firma?.metodo_autenticacion
  ]
    .map(v => String(v || '').toLowerCase())
    .join(' ')

  return /eq-?\s*fescol|fescol|firma\s*colectiva|colectiv|equipo/.test(fuentes)
}

function getIntegrantesGrupo(step) {
  const teamId = Number(step?.id_user ?? step?.id_equipo_proyecto ?? step?._id_equipo_proyecto ?? 0)
  if (!teamId) return []

  const idFlow = Number(step?.id_flow || surveyDetailStore.surveyDetail?.[0]?.id_flow || 0)
  const idProyecto = Number(step?.id_proyecto || surveyDetailStore.surveyDetail?.[0]?.id_proyecto || 0)
  const base = (equiposProyectosMiembrosFES.value || []).filter(
    m => Number(m?.id_equipo_proyecto) === teamId
  )
  if (!base.length) return []

  const porFlow = idFlow ? base.filter(m => Number(m?.id_flow) === idFlow) : []
  const porProyecto = idProyecto ? base.filter(m => Number(m?.id_proyecto) === idProyecto) : []
  const source = porFlow.length ? porFlow : (porProyecto.length ? porProyecto : base)

  const map = new Map()
  source.forEach((m) => {
    const key = Number(m?.id_user || 0) > 0
      ? `id:${Number(m?.id_user)}`
      : `name:${String(m?.nombre_user || '').trim().toLowerCase()}`

    const next = {
      id_user: Number(m?.id_user || 0),
      nombre_user: String(m?.nombre_user || '').trim(),
      estado_fes: Boolean(m?.estado_fes),
      fecha_fes: m?.fecha_fes || null
    }

    const prev = map.get(key)
    if (!prev) {
      map.set(key, next)
      return
    }

    // Conserva el registro marcado como firmado cuando exista.
    if (!prev.estado_fes && next.estado_fes) {
      map.set(key, next)
    }
  })

  return [...map.values()]
    .filter(m => m.nombre_user)
    .sort((a, b) => a.nombre_user.localeCompare(b.nombre_user, 'es', { sensitivity: 'base' }))
}

function hasVerDoc(segmento) {
  const attrs = Array.isArray(segmento?.attributes) ? segmento.attributes : []
  return attrs.some(attr => attr?.type === 'verDoc')
}

async function cargarEquiposProyectosMiembrosFES() {
  try {
    const { data } = await apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectosMiembrosFES')
    equiposProyectosMiembrosFES.value = Array.isArray(data) ? data : []
  } catch (e) {
    try {
      const { data } = await apiAxios.get('/servicio/leanglobal/obtenerEquiposProyectosMiembros')
      equiposProyectosMiembrosFES.value = Array.isArray(data) ? data : []
    } catch (e2) {
      console.error('Error cargando miembros FES:', e, e2)
      equiposProyectosMiembrosFES.value = []
    }
  }
}

function getSelectItems(options) {
  return options.map(opt => {
    if (typeof opt === 'object') {
      return {
        label: opt.label || opt.name || opt.value || '—',
        value: opt.value || opt.id || opt.label || '—'
      }
    } else {
      return {
        label: String(opt),
        value: opt
      }
    }
  })
}

function getCheckListLabel(attr) {
  const opts = attr.options ?? attr.values?.options ?? [];
  const match = opts.find(o => o.id === attr.default);
  return match?.label ?? attr.default ?? '—';
}

function displayAttrValue(attr) {
  if (!attr) return ''

  if (attr.type === 'comboBox' || attr.type === 'select') {
    return displayComboValue(attr)
  }

  // ✅ decimal
  if (attr.type === 'decimal') {
    return formatDecimal(attr.default, attr.cantiDec)
  }

  if (attr.type === 'number') {
    return attr.default ?? attr.value ?? ''
  }

  // ✅ Fechas
  if (attr.type === 'dateHourPicker' || attr.type === 'datePicker') {
    // Si viene con T (ISO), lo formateamos bonito
    if (attr.default && attr.default.includes('T')) {
      return attr.default.replace('T', ' ');
    }
    return attr.default ?? ''
  }

  // otros tipos (como antes)
  return attr.default ?? attr.value ?? attr.answer ?? attr.selected ?? ''
}

function formatDecimal(val, cantiDec = 2) {
  if (val == null || val === '') return ''

  // si ya viene como "12,00" lo respetamos, pero lo normalizamos a cantiDec
  let s = String(val).trim()

  // saca separadores de miles si llegan (1.234,56 -> 1234,56)
  s = s.replace(/\./g, '')

  // coma -> punto para parsear
  const n = parseFloat(s.replace(',', '.'))
  if (!Number.isFinite(n)) return String(val)

  const fixed = n.toFixed(Number(cantiDec) || 2)

  // vuelve a coma (y sin miles)
  return fixed.replace('.', ',')
}

function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date)) return ''; // por si viene inválida

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}


const chartId = (pos, idx) => `chart-${pos}-${idx}`;

const toNum = v => {
  if (v == null) return null;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
};

function renderMatrizChart(attr, el) {
  const rows = Array.isArray(attr.body) ? attr.body : [];
  const hdr = attr.headers?.[0] ?? [];

  // Busca índices por nombre; fallback a posiciones 1 y 2 para series, 0 o 1 para categorías
  const idxPk = hdr.findIndex(c => /pk.*medici/i.test(c?.label ?? ''));
  const idxMed = hdr.findIndex(c => /medici.*mv/i.test(c?.label ?? '')); // serie 1
  const idxY2 = 2; // “columna 3” por requerimiento (puede ser 'Estado' si es numérico)

  const idxCat = idxPk !== -1 ? idxPk : 0;      // categorías
  const idxY1 = idxMed !== -1 ? idxMed : 1;    // serie 1

  const categories = rows.map((r, i) => r?.[idxCat]?.value ?? i + 1);
  const y1 = rows.map(r => toNum(r?.[idxY1]?.value));
  const y2 = rows.map(r => toNum(r?.[idxY2]?.value));

  Highcharts.chart(el, {
    chart: { type: 'line' },
    title: { text: attr.label || '' },
    xAxis: { categories, title: { text: hdr[idxCat]?.label || null } },
    yAxis: { title: { text: '' } },
    tooltip: { shared: true },
    legend: { enabled: true },
    credits: { enabled: false },
    series: [
      { name: hdr[idxY1]?.label || 'Serie 1', data: y1 },
      { name: hdr[idxY2]?.label || 'Serie 2', data: y2 },
    ],
  });
}

async function renderAllCharts(segmentos) {
  await nextTick();
  (segmentos || []).forEach(seg => {
    (seg.attributes || []).forEach((attr, idx) => {
      if (attr?.grafico) {
        const el = document.getElementById(chartId(seg.posicion, idx));
        if (el) renderMatrizChart(attr, el);
      }
    });
  });
}



// Busca opciones declaradas en headers (p.ej. en "SI NO N/A")
function getHeaderOptions(attr) {
  const rows = Array.isArray(attr?.headers) ? attr.headers : [];
  for (const r of rows) {
    for (const c of (r || [])) {
      if (Array.isArray(c?.options) && c.options.length) return c.options;
    }
  }
  // fallback por si no vinieran en headers
  return [
    { id: 'si', label: 'Sí' },
    { id: 'no', label: 'No' },
    { id: 'n/a', label: 'N/A' },
  ];
}

// Mapea el valor almacenado a la etiqueta del header (admite "SI", "No", "n/a", etc.)
function mapCheckLabel(val, options) {
  const raw = (val ?? '').toString().trim();
  if (!raw) return '—';
  const norm = raw.toLowerCase();
  const hit = (options || []).find(o => (o.id ?? '').toString().toLowerCase() === norm);
  if (hit?.label) return hit.label;

  // Si ya viene como "SI/NO/N/A" lo normalizamos a la etiqueta
  if (['si', 'no', 'n/a'].includes(norm)) {
    const byNorm = (options || []).find(o => o.id === norm);
    return byNorm?.label ?? raw.toUpperCase();
  }
  // último recurso: mostrar tal cual
  return raw;
}


// Alineación por celda: default center; soporta "text-align", "textAlign" y el typo "text-aling"
function cellAlignPrint(cell) {
  const v = cell?.['text-align'] ?? cell?.textAlign ?? cell?.['text-aling'];
  if (v === 'left') return 'left';
  if (v === 'right') return 'right';
  return 'center';
}

// Lee opciones del header (columna "SI NO N/A") si vienen allí
function getMCheckOptions(attr) {
  // asume la primera fila de headers y busca la celda con opciones o, por defecto, la 3ª columna
  const firstRow = attr?.headers?.[0] || [];
  const explicit = firstRow.find(c => Array.isArray(c?.options));
  const opts = explicit?.options || firstRow?.[2]?.options || [];
  // normaliza a {id,label}
  return opts.map(o => ({
    id: (o.id ?? o.value ?? '').toString().toLowerCase(),
    label: o.label ?? o.id ?? o.value ?? ''
  }));
}

// Mapea el valor guardado (si/no/n/a, "SI"/"NO"/"N/A") a su label del header
function printCheckLabel(value, options) {
  const val = (value ?? '').toString().trim().toLowerCase();
  if (!val) return '';
  const found = (options || []).find(o => o.id === val);
  // si no encontramos, muestra el valor original uppercased
  return found?.label ?? value;
}

// Desplazamiento (en columnas) respecto a la posición de "Puntaje"
const METRICS_OFFSET = -1; // ← cámbialo a 2, 3, etc. si quieres mover más

function mcheckColCountPrint(attr) {
  const row = attr?.headers?.[0] || [];
  return row.reduce((acc, c) => acc + (c?.colspan ?? 1), 0);
}

function puntajeIndexPrint(attr) {
  const row = attr?.headers?.[0] || [];
  let idx = 0;
  for (const c of row) {
    const span = c?.colspan ?? 1;
    const label = String(c?.label ?? '').toLowerCase();
    if (label.includes('puntaje')) return idx;
    idx += span;
  }
  return Math.max(0, Math.min(2, idx - 1)); // fallback
}

function clampSpan(attr, span) {
  const total = mcheckColCountPrint(attr);
  return Math.max(0, Math.min(span, total));
}

// === Métricas ===
function metricValuePrint(attr, footerItem) {
  const { obtenido, maximo, desempeno } = attr.cachedMetrics || mcheckMetricsPrint(attr);
  const k = String(footerItem?.label ?? '').toLowerCase();
  if (k.includes('obtenido')) return obtenido;
  if (k.includes('máximo') || k.includes('maximo')) return maximo;
  if (k.includes('desempeño') || k.includes('desempeno')) return desempeno;
  return footerItem?.value ?? '';
}

function mcheckMetricsPrint(attr) {
  const hdr = attr?.headers?.[0] || [];
  let idxCheck = -1, idxPuntaje = -1;

  hdr.forEach((c, i) => {
    const t = String(c?.label ?? '').toLowerCase();
    if (t.includes('si') && t.includes('n/a')) idxCheck = i;   // "SI NO N/A"
    if (t.includes('puntaje')) idxPuntaje = i;                 // "Puntaje"
  });

  let obtenido = 0;
  let maximo = 0;

  (attr?.body || []).forEach(row => {
    const ch = String(row?.[idxCheck]?.value ?? '').trim().toUpperCase(); // SI / NO / N/A
    const p = toNumber(row?.[idxPuntaje]?.value);
    if (!Number.isNaN(p)) obtenido += p;
    if (ch !== 'N/A' && ch !== 'NA') maximo += 10; // cuenta SI/NO
  });

  const desempeno = maximo > 0 ? `${((obtenido / maximo) * 100).toFixed(0)}%` : '0%';
  return { obtenido, maximo, desempeno };
}

function toNumber(v) {
  if (v == null) return NaN;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : NaN;
}


// === Matrices a imprimir igual que "matriz" ===
const MATRIX_LIKE_TYPES = new Set([
  'matriz',
  'matrizExcavaciones',
  'matrizBorewrap',
  'matrizTransp',
  'matrizGranallado',
  'matrizProtal',
  'matrizPolypipe',
  'matrizSoldadura',
  'matrizCheck',
  'matrizCombustible'
]);

function isMatrixLike(attr) {
  return !!attr && MATRIX_LIKE_TYPES.has(attr.type);
}

// ¿el footer viene como 2D (array de filas) o 1D (array de objetos)?
function isFooter2D(footer) {
  return Array.isArray(footer) && Array.isArray(footer[0]);
}

// Busca índice de columna por label (match con regex)
function findColIndexByLabel(attr, re) {
  const row = attr?.headers?.[0] || [];
  return row.findIndex(c => re.test(String(c?.label ?? '')));
}

// Total para matrizTransp: suma la columna "Largo"
function totalLargoTransp(attr) {
  // intenta detectar la columna por nombre; fallback columna 3 (0-based)
  let idx = findColIndexByLabel(attr, /largo/i);
  if (idx < 0) idx = 3;

  const rows = Array.isArray(attr?.body) ? attr.body : [];
  const sum = rows.reduce((acc, r) => {
    const n = toNum(r?.[idx]?.value);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
  // si el componente ya guardó el total en el footer, respétalo
  const saved = attr?.footer?.[0]?.totalLargo;
  return Number.isFinite(saved) ? saved : Number(sum.toFixed(2));
}

// === SOLO PARA matrizCheck ===
function _normLabel(x) {
  return (x ?? '').toString().replace(/\s+/g, ' ').trim().toLowerCase()
}

// encuentra índice de "Puntaje" en headers[0]
function _findPuntajeIdxHeader_mcheck(attr) {
  const row0 = Array.isArray(attr?.headers?.[0]) ? attr.headers[0] : []
  return row0.findIndex(c => _normLabel(c?.label) === 'puntaje')
}

// si no hay header “Puntaje”, busca la 1ª col type:"number" en body
function _findNumberColIdxBody_mcheck(attr) {
  const rows = Array.isArray(attr?.body) ? attr.body : []
  const first = rows[0] || []
  return first.findIndex(c => (c?.type || '').toLowerCase() === 'number')
}

function _removeBodyColAt_mcheck(attr, colIdx) {
  if (!Array.isArray(attr?.body) || colIdx < 0) return
  attr.body = attr.body.map(r => Array.isArray(r) ? r.filter((_, i) => i !== colIdx) : r)
}

// Asegura columnas, pre-calcula métricas y elimina puntaje
function processMatrizCheck(segmentos) {
  (segmentos || []).forEach(seg => {
    (seg.attributes || []).forEach(attr => {
      if (attr?.type === 'matrizCheck') {
        const headers = attr.headers?.[0] || []

        // 1. Alineación (insertar celdas vacías si la imagen está corrida)
        const idxImg = headers.findIndex(c => (c.label || '').toLowerCase().includes('imagen'))
        if (idxImg !== -1) {
          const body = attr.body || []
          body.forEach(row => {
            if (!Array.isArray(row)) return
            const currImgIdx = row.findIndex(c => c?.type === 'image')
            // Si existe imagen y está antes de donde dice el header...
            if (currImgIdx !== -1 && currImgIdx < idxImg) {
              const diff = idxImg - currImgIdx
              for (let k = 0; k < diff; k++) {
                row.splice(currImgIdx, 0, { value: '', type: 'text' })
              }
            }
          })
        }

        // 2. Calcular métricas ANTES de eliminar columna puntaje
        attr.cachedMetrics = mcheckMetricsPrint(attr)

        // 3. Eliminar columna Puntaje (Header y Body)
        // Busca índice de puntaje
        const idxPunt = headers.findIndex(c => {
          const l = (c.label || '').toLowerCase()
          return l.includes('puntaje') || l === 'punt.' || l === 'punt'
        })

        if (idxPunt !== -1) {
          // Quitar del header
          headers.splice(idxPunt, 1)
          // Quitar del body
          if (Array.isArray(attr.body)) {
            attr.body.forEach(r => {
              if (Array.isArray(r)) r.splice(idxPunt, 1)
            })
          }
        }
      }
    })
  })
}

function getColumnWidth(attr, cIdx, rIdx, cell) {
  if (attr.type !== 'matrizCheck') return 'auto'
  // Solo aplicamos ancho en la primera fila de headers
  if (rIdx !== 0) return 'auto'

  // Columna 0: 50%
  if (cIdx === 0) return '50%'

  const label = (cell.label || '').toLowerCase()
  if (label.includes('observaci')) return '20%'
  if (label.includes('imagen')) return '20%'

  return 'auto'
}

function getPuntajeColIndexForFooter(attr) {
  if (!attr?.headers?.[0]) return -1
  return (attr.headers[0] || []).findIndex(c => {
    const l = (c?.label || '').toLowerCase().trim()
    return l.includes('puntaje') || l === 'punt.' || l === 'punt'
  })
}

// Aplica SOLO a atributos type === 'matrizCheck'
function sanitizeOnlyMatrizCheck(segmentos) {
  (segmentos || []).forEach(seg => {
    (seg.attributes || []).forEach(attr => {
      if (attr?.type === 'matrizCheck') {
        stripPuntajeFromMatrizCheck(attr)
      }
    })
  })
}

const firmasHistorial = computed(() => {
  let raw = surveyDetailStore.surveyDetail?.[0]?.approval_exec;

  // 1) Si viene string, intenta parsear
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw);
    } catch (e) {
      console.log('approval_exec inválido (string no-JSON):', raw);
      raw = [];
    }
  }

  // 2) Si no es array, fuerza array vacío
  const arr = Array.isArray(raw) ? raw : [];

  return arr
    .map(it => it?.firma ?? it)
    .filter(f => f && (f.nombre || f.rut));
});

function findFirmaByStep(step, historial, usadas = new Set()) {
  const hit = (historial || [])
    .slice()
    .reverse()
    .find(h => {
      if (usadas.has(h)) return false
      
      // Si el paso tiene un ID de usuario específico asignado, requerir coincidencia estricta de ID
      if (Number.isFinite(Number(step?.id_user)) && Number(step?.id_user) > 0) {
        return Number(h?.id_user) === Number(step?.id_user)
      }
      
      // Si no, buscar por coincidencia de rol
      return String(h?.rol || '').trim().toUpperCase() === String(step?.name_rol || '').trim().toUpperCase()
    }) || null

  if (hit) {
    usadas.add(hit)
  }
  return hit
}

const estructuraFirmas = computed(() => {
  const historial = firmasHistorial.value
  const usadas = new Set()
  return (flowStepsActuales.value || []).map(st => {
    let firmante = st?.nombre_user
    if (Number(st?.flow_tmpl_step_orden) === 1 && (!firmante || firmante === 'Sin asignar') && user.value) {
      firmante = user.value.nombre_user || ((user.value.name_frst || '') + ' ' + (user.value.apellido_pat || '')).trim()
    }
    if (Number(st?.flow_tmpl_step_orden) === 2 && (!firmante || firmante === 'Sin asignar') && superiorUser.value) {
      firmante = superiorUser.value.nombre_user || ((superiorUser.value.name_frst || '') + ' ' + (superiorUser.value.apellido_pat || '')).trim()
    }
    return {
      orden: st?.flow_tmpl_step_orden ?? '—',
      rol: st?.name_rol ?? '—',
      firmante: firmante || 'Sin asignar',
      estado: (() => {
        const hit = findFirmaByStep(st, historial, usadas)
        if (hit?.aprueba_rechaza) return String(hit.aprueba_rechaza).toUpperCase()
        return String(st?.estado || 'PENDIENTE').toUpperCase()
      })()
    }
  })
})

const firmasDetallePorPaso = computed(() => {
  const historial = firmasHistorial.value
  const usadas = new Set()
  return (flowStepsActuales.value || []).map(st => {
    const hit = findFirmaByStep(st, historial, usadas)
    let estado = 'PENDIENTE'
    if (hit?.aprueba_rechaza) {
      estado = String(hit.aprueba_rechaza).toUpperCase()
    } else if (st?.estado === 'APROBADO') {
      estado = 'APROBADO'
    }
    const esColectiva = esFirmaColectiva(st, hit)
    const integrantesDetalle = esColectiva ? getIntegrantesGrupo(st) : []

    let firmante = st?.nombre_user
    if (Number(st?.flow_tmpl_step_orden) === 1 && (!firmante || firmante === 'Sin asignar') && user.value) {
      firmante = user.value.nombre_user || ((user.value.name_frst || '') + ' ' + (user.value.apellido_pat || '')).trim()
    }
    if (Number(st?.flow_tmpl_step_orden) === 2 && (!firmante || firmante === 'Sin asignar') && superiorUser.value) {
      firmante = superiorUser.value.nombre_user || ((superiorUser.value.name_frst || '') + ' ' + (superiorUser.value.apellido_pat || '')).trim()
    }

    return {
      orden: st?.flow_tmpl_step_orden ?? '-',
      rol: st?.name_rol ?? '-',
      firmante: firmante || 'Sin asignar',
      rut: hit?.rut || '-',
      nombre: hit?.nombre || '-',
      fecha: hit?.fecha || '-',
      metodo_autenticacion: hit?.metodo_autenticacion || '-',
      codigo: hit?.codigo || hit?.codigo_validacion || '-',
      aprueba_rechaza: estado,
      observaciones: hit?.observaciones || '',
      es_firma_colectiva: esColectiva,
      integrantes_detalle: integrantesDetalle,
      integrantes_grupo: integrantesDetalle.map(m => m.nombre_user)
    }
  })
})

const firmasDetalleFilasTabla = computed(() => {
  const base = Array.isArray(firmasDetallePorPaso.value) ? firmasDetallePorPaso.value : []
  return base.flatMap((f) => {
    if (!f?.es_firma_colectiva) return [{ ...f, integrante_actual: null }]
    const integrantes = Array.isArray(f?.integrantes_detalle) ? f.integrantes_detalle : []
    if (!integrantes.length) return [{ ...f, integrante_actual: null }]
    return integrantes.map((miembro) => ({
      ...f,
      integrante_actual: miembro
    }))
  })
})


// Cache: { [id_doc]: { loading, error, meta, downloadUrl } }
const docCache = reactive({})

async function resolveDocMeta(idDoc) {
  const id = Number(idDoc || 0)
  if (!id) return null

  if (docCache[id]?.meta) return docCache[id].meta
  docCache[id] = { loading: true, error: '', meta: null, downloadUrl: '' }

  try {
    // usa tu API existente
    const resp = await apiAxios.get(`/servicio/leanglobal/obtenerTFMGFile?id_doc=${id}`)
    const row = Array.isArray(resp.data) ? resp.data[0] : resp.data

    if (!row) throw new Error('Documento no encontrado')
    if (!row.name_doc_interno) throw new Error('Documento sin name_doc_interno')

    // ✅ URL ABSOLUTA usando TUS variables
    const downloadUrl = `${BASE_URL}${row.name_doc_interno}`

    docCache[id] = { loading: false, error: '', meta: row, downloadUrl }
    return row
  } catch (e) {
    docCache[id] = {
      loading: false,
      error: e?.message || 'Error obteniendo documento',
      meta: null,
      downloadUrl: ''
    }
    return null
  }
}

// dispara la carga apenas se pinta
function ensureDocLoaded(attr) {
  const id = Number(attr?.id_doc || 0)
  if (!id) return
  if (docCache[id]?.meta || docCache[id]?.loading) return
  resolveDocMeta(id)
}

// ✅ helper para usar en el template
function resolveDocUrl(attr) {
  const id = Number(attr?.id_doc || 0)
  if (!id) return '#'
  return docCache[id]?.downloadUrl || '#'
}

function resolveDocName(attr) {
  const id = Number(attr?.id_doc || 0)
  const meta = id ? docCache[id]?.meta : null
  return meta?.name_doc_orig || attr?.label || `Documento #${id}`
}

</script>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800;900&display=swap');

:global(html),
:global(body),
:global(#app) {
  background: #fff !important;
  color: #0f172a !important;
  min-height: 100%;
}

.print-page {
  font-family: 'Inter', sans-serif;
  color: #1e293b;
  background: #fff;
  min-height: 100vh;
  padding: 24px;
  font-size: 11px;
  line-height: 1.5;
}

.fixed-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 3px solid var(--brand-primary, #d97706);
  padding-bottom: 12px;
  margin-bottom: 20px;
}

.fixed-header .logo img {
  max-height: 50px;
  max-width: 130px;
  object-fit: contain;
}

.fixed-header .report-title h1 {
  margin: 0;
  font-family: 'Outfit', sans-serif;
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #0f172a;
}

.content {
  margin-top: 20px;
}

/* Flex para las dos tablas */
.info-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

/* Cada tabla ocupa 50% */
.info-block {
  flex: 1;
}

/* Títulos de bloque */
.info-title {
  font-family: 'Outfit', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
  border-left: 3px solid var(--brand-primary, #d97706);
  padding-left: 8px;
}

/* Tablas */
.info-table,
.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
}

.info-table td,
.data-table td {
  border: 1px solid #e2e8f0;
  padding: 6px 10px;
  vertical-align: middle;
  font-size: 11px;
  line-height: 1.4;
  color: #334155;
}

/* Celdas de etiqueta / valor */
.label-cell {
  font-weight: 600;
  background-color: #f8fafc;
  color: #475569;
  width: 25%;
}

.label-cell-header {
  font-weight: 700;
  background-color: #f1f5f9;
  color: #1e293b;
  text-transform: uppercase;
  font-size: 10px;
  letter-spacing: 0.05em;
  width: 25%;
}

/* Segment titles */
.segment-title {
  font-family: 'Outfit', sans-serif;
  margin-top: 36px !important;
  padding-top: 12px !important;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #f59e0b;
  padding-bottom: 8px;
  margin-bottom: 18px !important;
  clear: both;
  page-break-after: avoid;
}

/* Imágenes */
.photo-img {
  /* más pequeño */
  margin: 4px;
}

.photo-container {
  display: flex;
  gap: 8px;
  /* separación opcional entre imágenes */
}

.photo-img {
  display: block;
  /* para que no haya espacios blancos extra */
  /* width y height ya se le aplican inline según la cantidad de imágenes */
}





.titulo-firma {
  font-family: 'Outfit', sans-serif;
  text-align: center;
  color: #0f172a;
  font-size: 15px;
  margin: 20px 0;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.signature-block {
  display: flex;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background-color: #f8fafc;
  padding: 16px;
  margin-bottom: 20px;
  align-items: flex-start;
  page-break-inside: avoid;
}

/* QR ocupa 20% */
.qr-container {
  flex: 0 0 20%;
  max-width: 20%;
}

.qr-code {
  width: 100%;
  height: auto;
}

/* Contenido ocupa 80% */
.signature-content {
  flex: 0 0 80%;
  max-width: 80%;
  display: flex;
  margin-left: 16px;
}

/* Cada columna dentro del 80% ocupa 50% de ese espacio (=> 40% total) */
.left-col,
.right-col {
  flex: 0 0 50%;
}

.left-col p,
.right-col p {
  margin: 4px 0;
}


.tabla-uniforme {
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  /* opcional, mejora bordes */
}

.tabla-uniforme th,
.tabla-uniforme td {
  width: calc(100% / 6);
  /* 6 columnas en tu caso */
  text-align: center;
  padding: 6px;
  border: 1px solid #ccc;
  /* opcional */
}

.mc-img-wrap {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mc-img {
  max-width: 100%;
  width: 120px;
  height: 100px;
  object-fit: contain;
  border: 1px solid #ccc;
  padding: 2px;
  background: #fff;
}

.ppd-cuadrilla {
  border: 1px solid #ddd;
  margin-bottom: 16px;
  padding: 8px 10px;
  background: #f8f8f8;
}

.ppd-cuadrilla-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.ppd-cuadrilla-title {
  font-weight: 600;
}

.ppd-chip {
  border-radius: 999px;
  padding: 2px 10px;
  border: 1px solid #ccc;
  font-size: 11px;
  background: #eee;
}

.ppd-partida-block {
  background: #fff;
  border: 1px solid #ddd;
  padding: 8px 10px;
  margin-bottom: 10px;
}

.ppd-partida-title {
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 6px 0;
}

.ppd-subtitle {
  font-size: 12px;
  font-weight: 600;
  margin: 8px 0 4px 0;
}

.titulo-firma {
  text-align: center;
  color: black;
  font-size: 16px;
  margin: 16px 0;
  font-weight: normal;
}

/* Tabla de firmantes */
.sign-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  margin-top: 4px;
}

.sign-table th,
.sign-table td {
  text-align: left;
  padding: 4px 6px;
  border: 1px solid #d1d5db;
  vertical-align: top;
}

.sign-table th {
  background: #e5e7eb;
  font-weight: 700;
}

.sign-row {
  padding: 6px 8px !important;
}

.sign-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px 10px;
}

.sign-item {
  font-size: 10px;
  line-height: 1.25;
  word-break: break-word;
}

.sign-item-name {
  font-size: 9.5px;
}

.sign-line {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.sign-rut {
  font-weight: 600;
}

.sign-fecha,
.sign-metodo {
  white-space: nowrap;
}

.sign-subline {
  margin-top: 2px;
  font-size: 10px;
  color: #333;
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.sign-integrantes {
  margin-top: 2px;
  font-size: 10px;
  color: #333;
}

.sign-observacion {
  margin-top: 2px;
  font-size: 10px;
}

.tabla-uniforme th,
.tabla-uniforme td {
  width: calc(100% / 6);
}

.em-wrap {
  padding: 8px;
}

.em-title {
  font-weight: 700;
  margin: 4px 0 8px 0;
}

.em-table {
  margin-bottom: 0;
}

/* Estilos para CheckList Tecles y tipos especializados */
.mono-wrap {
  margin-bottom: 16px;
}

.mono-title {
  margin: 8px 0 6px 0;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.mono-table {
  margin-top: 0;
  table-layout: fixed;
}

.mono-table th,
.mono-table td {
  border: 1px solid #9ca3af;
  font-size: 11px;
  line-height: 1.1;
  padding: 4px 6px;
}

.mono-head-item,
.mono-head-date,
.mono-head-obs {
  background-color: #e5e7eb;
  font-weight: 700;
  text-align: center;
}

.mono-head-item,
.mono-item-cell {
  width: 25%;
}

.mono-head-days,
.mono-day-cell {
  background-color: #84cc16;
  text-align: center;
  font-weight: 700;
}

.mono-head-days {
  width: 25%;
}

.mono-day-cell,
.mono-check-cell {
  width: 5%;
}

.mono-item-cell {
  font-weight: 600;
  text-transform: uppercase;
}

.mono-check-cell,
.mono-date-cell {
  text-align: center;
  font-weight: 600;
}

.mono-obs-cell {
  text-align: left;
}

.vibro-wrap {
  margin-bottom: 16px;
}

.vibro-table {
  border: 2px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.vibro-table th,
.vibro-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.1;
  padding: 4px 6px;
}

.vibro-head-left {
  width: 25%;
  background: #e5e7eb;
  text-align: left;
  font-weight: 700;
}

.vibro-head-obs {
  width: 50%;
  background: #e5e7eb;
  text-align: center;
  font-weight: 700;
}

.vibro-day-cell {
  width: 5%;
  background: #84cc16;
  text-align: center;
  font-weight: 700;
}

.vibro-section {
  background: #e5e7eb;
  font-weight: 700;
  text-align: left;
}

.vibro-item-cell {
  width: 25%;
  white-space: pre-wrap;
}

.vibro-mark-cell {
  width: 5%;
  text-align: center;
  font-weight: 700;
}

.vibro-obs-cell {
  width: 50%;
  text-align: left;
}

.vibro-footer-cell {
  padding: 10px 8px !important;
}

.vibro-result-grid {
  width: 460px;
  max-width: 100%;
  display: flex;
  gap: 14px;
}

.vibro-result-label {
  flex: 1;
  border: 2px solid #6b7280;
  font-weight: 700;
  text-align: center;
  padding: 6px 10px;
  background: #fff;
}

.vibro-result-selected {
  background: #d1d5db;
}

.martillo-table {
  border: 2px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.martillo-table th,
.martillo-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.1;
  padding: 4px 6px;
}

.martillo-head-left {
  width: 25%;
  background: #e5e7eb;
  text-align: left;
  font-weight: 700;
}

.martillo-n-col {
  width: 4%;
  text-align: center;
  font-weight: 700;
}

.martillo-item-head {
  width: 21%;
  background: #e5e7eb;
  text-align: left;
  font-weight: 700;
}

.martillo-item-cell {
  width: 21%;
  white-space: pre-wrap;
}

.martillo-obs-note {
  margin-top: 8px;
  font-size: 11px;
}

.ilum-table {
  border: 2px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.ilum-table th,
.ilum-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.1;
  padding: 4px 6px;
}

.ilum-head-left,
.ilum-item-cell {
  width: 25%;
}

.ilum-head-state {
  width: 25%;
  background: #e5e7eb;
  text-align: center;
  font-weight: 700;
}

.ilum-head-left,
.ilum-head-obs {
  background: #e5e7eb;
  text-align: center;
  font-weight: 700;
}

.ilum-head-obs,
.ilum-obs-cell {
  width: 50%;
}

.ilum-item-cell,
.ilum-obs-cell {
  text-align: left;
}

.ilum-section-cell {
  font-weight: 700;
  text-transform: uppercase;
  text-align: left;
}

.disp-table {
  border: 2px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.disp-table th,
.disp-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.1;
  padding: 4px 6px;
}

.disp-act-col,
.disp-item-cell {
  width: 25%;
}

.disp-act-col,
.disp-resp-col,
.disp-fecha-col {
  background: #fff;
  font-weight: 700;
  text-align: left;
}

.disp-resp-col {
  width: 25%;
  text-align: center;
}

.disp-fecha-col {
  width: 25%;
  text-align: center;
}

.disp-item-cell,
.disp-subhead-cell,
.disp-blank-cell {
  text-align: left;
}

.disp-subhead-cell {
  font-weight: 700;
}

.disp-obs-table {
  border: 1px solid #000;
  margin-top: 8px;
  table-layout: fixed;
}

.disp-obs-table td {
  border: 1px solid #000;
  font-size: 11px;
  padding: 4px 6px;
}

.disp-obs-title {
  font-weight: 700;
}

.disp-obs-line {
  font-weight: 400;
  display: inline-block;
  min-width: 200px;
}

.disp-obs-empty {
  height: 16px;
}

.hm-table {
  border: 2px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.hm-table th,
.hm-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.1;
  padding: 3px 4px;
}

.hm-left-head,
.hm-title-head,
.hm-item,
.hm-item-highlight {
  width: 25%;
}

.hm-days-head {
  width: 25%;
  background: #8bcf3f;
  font-weight: 700;
  text-align: center;
}

.hm-obs-head,
.hm-obs-cell {
  width: 50%;
}

.hm-title-head {
  font-size: 28px;
  font-weight: 700;
  text-align: center;
}

.hm-item {
  text-align: left;
}

.hm-item-highlight {
  background: #00ff00;
  text-align: left;
}

.hm-note-cell {
  color: #d10000;
  font-weight: 700;
  text-align: left;
}

.hm-bottom-note {
  text-align: center;
}

.hm-section2-head {
  font-weight: 700;
  text-align: left;
}

.hm-days-inline-head {
  background: #a7d86f;
  font-weight: 700;
  text-align: center;
}

.hm-inline-obs {
  text-align: left;
}

.camion-table {
  border: 2px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.camion-table th,
.camion-table td {
  border: 1px solid #000;
  font-size: 10px;
  line-height: 1.1;
  padding: 3px 4px;
}

.cam-left-head,
.cam-item {
  width: 25% !important;
  font-weight: 700;
  text-align: left;
}

.cam-week-head {
  text-align: center;
  font-weight: 700;
}

.cam-week-1 {
  background: #8bcf3f;
}

.cam-week-2 {
  background: #22b6e8;
}

.cam-si,
.cam-no,
.cam-na,
.cam-mark-cell {
  width: 6.25% !important;
  text-align: center;
}

.cam-si {
  background: #8bcf3f;
  font-weight: 700;
}

.cam-no {
  background: #22b6e8;
  font-weight: 700;
}

.cam-na {
  background: #22b6e8;
  font-weight: 700;
}

.cam-section {
  font-weight: 700;
  text-align: left;
}

.cam-week-col {
  text-align: center;
  font-weight: 700;
}

.extintor-print-wrap {
  padding: 0;
}

.extintor-card {
  margin-top: 8px;
  border: 1px solid #000;
}

.extintor-card-title {
  font-weight: 700;
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid #000;
  background: #f3f4f6;
}

.extintor-vertical-table {
  border: 1px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.extintor-vertical-table th,
.extintor-vertical-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.2;
  padding: 4px 6px;
}

.extintor-concept-col {
  width: 78%;
  text-align: left;
}

.extintor-state-col {
  width: 22%;
  text-align: center;
  font-weight: 700;
}

.epp-print-wrap,
.banos-print-wrap,
.ats-print-wrap,
.condseg-print-wrap {
  padding: 0;
}

.epp-card,
.banos-block,
.ats-block,
.condseg-block {
  margin-top: 8px;
  border: 1px solid #000;
}

.epp-card-title,
.banos-block-title,
.ats-block-title,
.condseg-block-title {
  font-weight: 700;
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid #000;
  background: #f3f4f6;
}

.epp-print-table,
.banos-print-table,
.ats-print-table,
.ats-task-table,
.condseg-print-table {
  border: 1px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.epp-print-table th,
.epp-print-table td,
.banos-print-table th,
.banos-print-table td,
.ats-print-table th,
.ats-print-table td,
.ats-task-table th,
.ats-task-table td,
.condseg-print-table th,
.condseg-print-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.2;
  padding: 4px 6px;
  vertical-align: top;
}

.epp-item-col {
  width: 72%;
  text-align: left;
}

.epp-state-col {
  width: 28%;
  text-align: center;
  font-weight: 700;
}

.epp-obs-cell {
  text-align: left;
  font-weight: 500;
}

.epp-photo-cell {
  text-align: left;
  font-weight: 400;
}

.banos-num-col {
  width: 6%;
  text-align: center;
}

.banos-question-col {
  width: 46%;
  text-align: left;
}

.banos-state-col {
  width: 10%;
  text-align: center;
  font-weight: 700;
}

.banos-obs-col {
  width: 23%;
  text-align: left;
}

.banos-date-col {
  width: 15%;
  text-align: center;
}

.ats-num-col {
  width: 8%;
  text-align: center;
}

.ats-item-col {
  width: 74%;
  text-align: left;
}

.ats-tick-col {
  width: 18%;
  text-align: center;
  font-weight: 700;
}

.ats-task-etapa-col {
  width: 18%;
  text-align: left;
}

.ats-task-peligro-col {
  width: 12%;
  text-align: left;
}

.ats-task-riesgo-col {
  width: 14%;
  text-align: left;
}

.ats-multi-block {
  padding: 2px 0;
  border-bottom: 1px dashed #d1d5db;
}

.ats-multi-block:last-child {
  border-bottom: 0;
}

.ats-task-po-col,
.ats-task-cp-col {
  width: 6%;
  text-align: center;
}

.ats-task-pond-col {
  width: 9%;
  text-align: center;
}

.ats-task-medidas-col {
  width: 35%;
  text-align: left;
}

.condseg-group-title {
  margin-top: 8px;
  border: 1px solid #000;
  padding: 6px 8px;
  font-weight: 700;
  background: #f9fafb;
}

.condseg-section-title {
  border: 1px solid #000;
  border-radius: 6px;
  margin: 6px 8px 0;
  padding: 4px 6px;
  font-size: 11px;
  font-weight: 700;
  background: #eef2ff;
}

.condseg-block-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.condseg-apply-chip {
  font-size: 10px;
  padding: 2px 6px;
  border: 1px solid #000;
  border-radius: 12px;
  background: #fff;
  white-space: nowrap;
}

.condseg-info-text {
  margin: 6px 8px 0;
  padding: 4px 6px;
  border: 1px solid #93c5fd;
  border-radius: 6px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 10.5px;
  line-height: 1.25;
}

.condseg-code-col {
  width: 8%;
  text-align: center;
}

.condseg-item-col {
  width: 48%;
  text-align: left;
}

.condseg-state-col {
  width: 10%;
  text-align: center;
  font-weight: 700;
}

.condseg-sev-col {
  width: 10%;
  text-align: center;
  font-weight: 700;
}

.condseg-obs-col {
  width: 24%;
  text-align: left;
}

.tecles-table,
.ingreso-table,
.ext-table {
  border: 2px solid #000;
  margin-top: 0;
  table-layout: fixed;
}

.tecles-table th,
.tecles-table td,
.ingreso-table th,
.ingreso-table td,
.ext-table th,
.ext-table td {
  border: 1px solid #000;
  font-size: 11px;
  line-height: 1.1;
  padding: 3px 4px;
}

.tecles-head-left,
.tecles-item-cell {
  width: 25% !important;
}

.tecles-head-left {
  background: #e5e7eb;
  font-weight: 700;
  text-align: left;
}

.tecles-state-head {
  width: 3.5% !important;
  background: #22b6e8;
  font-weight: 700;
  text-align: center;
}

.tecles-obs-head,
.tecles-obs-cell {
  width: 39.5% !important;
  text-align: left;
}

.tecles-obs-head {
  background: #e5e7eb;
  font-weight: 700;
  text-align: center;
}

.tecles-section {
  font-weight: 700;
  text-align: left;
}

.ingreso-name-head,
.ingreso-name-cell {
  width: 25%;
  font-weight: 700;
  text-align: center;
}

.ingreso-access-head {
  background: #fff;
  font-weight: 700;
  text-align: center;
}

.ingreso-sub-head {
  font-weight: 700;
  text-align: center;
}

.ingreso-time-cell {
  text-align: center;
}

.ext-section {
  font-weight: 700;
  text-align: left;
}

.ext-result-cell {
  font-weight: 700;
  text-align: center;
}

.betonera-detail-cell {
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
}

.betonera-result-row {
  width: 460px;
  max-width: 100%;
  border: 1px solid #000;
  display: grid;
  grid-template-columns: 1fr 0.6fr 1fr 1.2fr;
}

.betonera-result-label {
  border-right: 1px solid #000;
  font-weight: 700;
  text-align: center;
  padding: 4px 8px;
  background: #fff;
}

.betonera-result-gap {
  border-right: 1px solid #000;
  min-height: 24px;
}

.betonera-result-row > :last-child {
  border-right: 0;
}

.check-tecles-header {
  background-color: #90EE90;
  padding: 8px;
  border-radius: 4px;
  margin: 8px 0;
  font-weight: 600;
}

.day-badge {
  background-color: #00AA00;
  color: white;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
}

.special-attr-box {
  background-color: #f0f8ff;
  padding: 12px;
  border-left: 4px solid #00AA00;
  border-radius: 4px;
  margin-bottom: 16px;
}

.special-attr-title {
  color: #00AA00;
  font-weight: 600;
  margin: 0 0 12px 0;
}

.special-item {
  margin-bottom: 8px;
  padding: 8px;
  background-color: white;
  border-radius: 3px;
  border: 1px solid #ddd;
}

.data-table-verdoc {
  border: 0 !important;
  background: transparent !important;
  margin: 0 !important;
}

.data-table-verdoc > thead,
.data-table-verdoc > tbody,
.data-table-verdoc > tfoot,
.data-table-verdoc > thead > tr,
.data-table-verdoc > tbody > tr,
.data-table-verdoc > tfoot > tr,
.data-table-verdoc > thead > tr > th,
.data-table-verdoc > tbody > tr > td,
.data-table-verdoc > tfoot > tr > td {
  border: 0 !important;
  background: transparent !important;
}

.verdoc-page-break {
  margin: 0;
  padding: 0;
}

.verdoc-page-break :deep(.ver-doc-container) {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.verdoc-page-break :deep(.d-flex.align-center.justify-space-between.mb-2) {
  display: none !important;
}

.verdoc-page-break :deep(.v-btn) {
  display: none !important;
}

.verdoc-page-break :deep(.preview-box) {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

.verdoc-page-break :deep(.html-embedded) {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
}

.verdoc-page-break :deep(.html-embedded table) {
  width: 100% !important;
  max-width: 100% !important;
  table-layout: fixed !important;
}

.verdoc-page-break :deep(.html-embedded td),
.verdoc-page-break :deep(.html-embedded th),
.verdoc-page-break :deep(.html-embedded p),
.verdoc-page-break :deep(.html-embedded li),
.verdoc-page-break :deep(.html-embedded div),
.verdoc-page-break :deep(.html-embedded span) {
  overflow-wrap: anywhere !important;
  word-break: break-word !important;
  white-space: normal !important;
}

.verdoc-page-break :deep(.html-embedded img),
.verdoc-page-break :deep(.html-embedded svg),
.verdoc-page-break :deep(.html-embedded iframe) {
  max-width: 100% !important;
  height: auto !important;
}

.verdoc-page-break :deep(.html-embedded > *),
.verdoc-page-break :deep(.html-embedded *:first-child) {
  margin-top: 0 !important;
}

.page-break-row,
.page-break-row > td {
  background: transparent !important;
  border: 0 !important;
  padding: 0 !important;
}

@media print {
  .signature-block {
    display: none !important;
  }
  .verdoc-page-break {
    break-before: page;
    page-break-before: always;
  }

  .verdoc-page-break :deep(.d-flex.align-center.justify-space-between.mb-2) {
    display: none !important;
  }

  .verdoc-page-break :deep(.preview-box) {
    background: transparent !important;
    padding: 0 !important;
    margin-top: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .verdoc-page-break :deep(.rounded),
  .verdoc-page-break :deep(.border),
  .verdoc-page-break :deep(.v-card),
  .verdoc-page-break :deep(.v-sheet) {
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: transparent !important;
  }

  .page-break-row {
    page-break-after: auto;
    break-after: auto;
    page-break-inside: auto;
    break-inside: auto;
    display: table-row;
  }

  .page-break-row > td {
    page-break-inside: auto;
    break-inside: auto;
  }
}

/* Estilos unificados para Checklists Diarios y Semanales (Alza Hombre, Flota y CDCH) */
.alza-wrap,
.weekly-wrap {
  margin-bottom: 16px;
  break-inside: avoid;
}

.alza-info-table,
.weekly-info-table {
  margin-bottom: 10px;
}

.alza-table,
.weekly-table {
  border: 1px solid #cbd5e1; /* Slate 300 */
  border-collapse: collapse;
  margin-top: 0;
  table-layout: fixed;
  width: 100%;
}

.alza-table th,
.alza-table td,
.weekly-table th,
.weekly-table td {
  border: 1px solid #cbd5e1; /* Slate 300 */
  font-family: Arial, sans-serif;
  font-size: 10px;
  line-height: 1.2;
  padding: 4px 6px;
}

.alza-head-left,
.weekly-head-left {
  background: #f1f5f9; /* Slate 100 */
  font-weight: 700;
  color: #0f172a; /* Slate 900 */
  text-align: left;
  vertical-align: middle;
}

.alza-day-head,
.weekly-day-head {
  background: #f1f5f9; /* Slate 100 */
  font-weight: 700;
  color: #0f172a;
  text-align: center;
}

.alza-day-cell,
.weekly-day-cell {
  background: #e2e8f0; /* Slate 200 */
  text-align: center;
  font-weight: 700;
}

.alza-meta-row,
.weekly-meta-row {
  background: #f8fafc; /* Slate 50 */
}

.alza-meta-label,
.weekly-meta-label {
  font-weight: 700;
  text-align: left;
  color: #334155; /* Slate 700 */
}

.alza-meta-value,
.weekly-meta-value {
  text-align: center;
  font-weight: 600;
  font-size: 9px;
  color: #0f172a;
}

.alza-section-title-cell,
.weekly-section-title-cell {
  background: #e2e8f0; /* Slate 200 */
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  color: #0f172a;
}

.alza-item-label-cell,
.weekly-item-label-cell {
  text-align: left;
  font-weight: 500;
  background: #ffffff;
}

.alza-item-val-cell,
.weekly-item-val-cell {
  text-align: center;
  font-weight: 700;
}

/* Colores de Valoración Condicional Premium (LeanGlobal) */
.alza-val-ok,
.weekly-val-ok {
  background-color: #d1fae5 !important; /* Emerald 100 */
  color: #065f46 !important; /* Emerald 800 */
  font-weight: 700;
  text-align: center;
}

.alza-val-bad,
.weekly-val-bad {
  background-color: #fee2e2 !important; /* Rose 100 */
  color: #991b1b !important; /* Rose 800 */
  font-weight: 700;
  text-align: center;
}

.weekly-obs-table {
  border: 1px solid #cbd5e1; /* Slate 300 */
  margin-top: 10px;
  width: 100%;
  border-collapse: collapse;
}

.weekly-obs-table td {
  border: 1px solid #cbd5e1;
  font-size: 10px;
  line-height: 1.2;
  padding: 4px 6px;
}
</style>

