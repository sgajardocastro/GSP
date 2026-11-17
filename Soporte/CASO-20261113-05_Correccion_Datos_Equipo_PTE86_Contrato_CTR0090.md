# CASO-20261113-05: Corrección de Individualización de Maquinaria a Plataforma PTE-86 en Contrato CTR-2026-0090 (Royal Rental 003 - Colegio Pumahue)

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261113-05`
- **Fecha / Hora:** `2026-11-13 16:15 CLT` (Resuelto y certificado a las `16:26 CLT`)
- **Operador / Usuario Afectado:** Sergio Gajardo (`id_user = 55`, Dirección Comercial & Operaciones) / Administración Royal Rental
- **Negocio / OT:** Negocio Royal Rental `003` (`RYL-2611-00003`, `id_proyecto = 90`) — COLEGIO PUMAHUE (Cliente: SOC EDUCACIONAL TEMUCO S A)
- **Contrato Involucrado:** Folio `CTR-2026-0090` (Anexo Contrato de Arrendamiento de Maquinaria - Plataforma)
- **Equipos Involucrados:**
  - Plataforma Tijera Eléctrica `PTE-86` (`id_equipo = 129`, Zoomlion ZS0808AC-LI, S/N PTE-86-SN - Equipo Real)
  - Maquinaria Genérica XCMG / XUG0147ACSRL0132 (Valores de muestra erróneamente impresos en PDF inicial)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`)
- **Severidad:** **Media-Alta** (Invalidez legal y comercial del contrato de arriendo enviado a firma electrónica FES ante el mandante)

---

## 2. Síntoma Reportado por Terreno / Administración
Al emitirse el contrato de arrendamiento oficial `CTR-2026-0090` para el cliente Soc. Educacional Temuco S.A. (Colegio Pumahue), el documento PDF mostraba en la sección *1.- INDIVIDUALIZACIÓN DE LA MAQUINARIA* datos técnicos que no correspondían a la máquina real asignada:
- NRO DE SERIE: `XUG0147ACSRL0132`
- NRO DE MOTOR: `7RE8931`
- MODELO: `PLATAFORMA TIJERA ELECTRICA`
- MARCA: `XCMG`

El equipo real del arriendo corresponde a la plataforma tijera eléctrica interna **PTE-86**. Se requería regenerar el PDF oficial con los datos fidedignos de la máquina para que el cliente pudiera validarlo y firmarlo vía FES, manteniendo la trazabilidad y registrando la solución estructural pendiente.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
1. **Inspección de Equipamiento en Base de Datos (`sch_leangsp_prod.tequ_equipo`):**
   - El equipo `PTE-86` ya se encontraba registrado en `tequ_equipo` bajo `id_equipo = 129`:
     - `patente`: `PTE-86`
     - `codigo_interno`: `PTE-86`
     - `marca`: `ZOOMLION`
     - `modelo`: `ZS0808AC-LI`
     - `numero_serie`: `PTE-86-SN`
     - `ano_fabricacion`: `2026`
     - `json_data`: `{"propulsion": "ELECTRICA", "tipo_planilla": "PLATAFORMA TIJERA ELECTRICA", "codigo_original": "PTE-86", "modelo_planilla": "ZS0808AC-LI", "empresa_planilla": "LOGISTICA DEL SUR"}`
2. **Inspección del Proyecto (`sch_leangsp_prod.tpry_proyecto` id = 90):**
   - En las líneas operativas vigentes y preparación de patio, el proyecto ya tenía asignado el `id_equipo = 129` (`PTE-86`).
   - Sin embargo, en `crm_v1.lineas_servicio[0]`, los atributos técnicos específicos (`serie`, `motor`, etc.) no venían deserializados.
3. **Inspección del Generador Backend (`proyectoModel.obtenerHtmlContratoArriendo`):**
   - El código fuente leía:
     ```javascript
     const maquiSerie = datosExtra.serie || eqPrincipal.serie || 'XUG0147ACSRL0132';
     const maquiMotor = datosExtra.motor || eqPrincipal.motor || '7RE8931';
     const maquiModelo = datosExtra.modelo || eqPrincipal.subcategoria || eqPrincipal.descripcion || 'XGA16E';
     const maquiMarca = datosExtra.marca || eqPrincipal.marca || 'XCMG';
     const maquiAnio = datosExtra.anio || '2026';
     ```
   - Al no existir `serie` ni `motor` en `lineas_servicio[0]`, y no haber consultado directamente la tabla relacional `tequ_equipo`, el generador imprimía los fallbacks en duro de muestra.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
Ausencia de resolución relacional dinámica en `proyectoModel.obtenerHtmlContratoArriendo`: el generador dependía de strings hardcodeados de ejemplo como fallback en lugar de consultar la tabla maestra de equipos `tequ_equipo` a partir del equipo asignado en la operación (`lineas_operativas_vigentes` o `ejecucion_v1.equipo_id`).

---

## 5. Plan de Mitigación y Resolución
1. **Regeneración de Contrato con Datos Fidedignos de PTE-86:**
   - Inyección controlada de los atributos reales de la máquina `PTE-86`:
     - Serie: `PTE-86-SN`
     - Motor: `S/N` (Eléctrica)
     - Modelo: `ZS0808AC-LI`
     - Marca: `ZOOMLION`
     - Año: `2026`
   - Invocación de `generarContratoArriendoVersion(90, datosExtra)` con el motor de renderizado oficial `wkhtmltopdf`.
2. **Actualización de Almacenamiento y Documentos:**
   - Compilación exitosa del PDF canónico en `/u05/LeanDocs/GSP/prod/contratos/2026/11/CTR-2026-0090.pdf` y réplica en `public/contratos/`.
   - Registro en `sch_leangsp_prod.tfmg_file` con `id_doc = 1940`.
3. **Sincronización Transaccional de Esquemas JSON:**
   - Actualización de `json_field->'contrato_arriendo'` y `json_field->'crm_v1'->'contrato'` en `tpry_proyecto` id 90 preservando el token público de firma FES intacto:
     - `token_publico`: `9dfd5555bd9da92dd9a9c30c8714c12da43f145ea2c6cc69`
     - `url_publica_firma`: `https://servidor.leanglobal.cl/lg-gsp-prod/firmar-contrato?token=9dfd5555bd9da92dd9a9c30c8714c12da43f145ea2c6cc69`
     - `url_pdf`: `/api/archivo/ver/1940`

---

## 6. Verificación & Certificación
1. **Auditoría de Texto en PDF Generado (`pdftotext`):**
   - Sección *1.- INDIVIDUALIZACIÓN DE LA MAQUINARIA* extraída directamente del archivo en el servidor:
     - `NRO DE SERIE: PTE-86-SN`
     - `NRO DE MOTOR: S/N`
     - `MODELO: ZS0808AC-LI`
     - `AÑO: 2026`
     - `MARCA: ZOOMLION`
     - `PROPIETARIO: LUIS OMAR GHISELLINI`
   - Cero menciones de `XUG0147ACSRL0132`, `7RE8931` ni `XCMG`.
2. **Pruebas de Conectividad HTTP:**
   - `GET https://servidor.leanglobal.cl/lg-gsp-prod/firmar-contrato?token=9dfd5555bd9da92dd9a9c30c8714c12da43f145ea2c6cc69` -> **HTTP 200 OK**
   - `GET https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/1940` -> **HTTP 200 OK**
   - `GET https://servidor.leanglobal.cl/lg-gsp-prod/api/archivo/ver/1921` -> **HTTP 200 OK**

---

## 7. Plan de Prevención y Solución de Fondo (Backlog)
- **Registro en Backlog Técnico (`Gestión/tareas.md`):** Tarea prioritaria de refactorización de `obtenerHtmlContratoArriendo` para implementar resolución automática contra `tequ_equipo` vía `INNER JOIN` o `SELECT` condicional según el `equipo_assigned_id`, erradicando de forma definitiva cualquier fallback con valores de muestra ficticios (`REQ-1171`).

---

## 8. Análisis de Recurrencia y Blindaje Definitivo a Nivel de Datos de Origen (14-Nov-2026)
- **Incidente de Recurrencia:** El 13-nov a las 22:48 CLT, la ejecutiva comercial abrió la oportunidad en el CRM y presionó "Previsualizar Contrato / Generar PDF" antes de despachar el correo y WhatsApp formal. El frontend invocó `/proyectos/90/contrato/generar-pdf` enviando únicamente fechas y nombres (sin campos de máquina). El backend leyó `lineas_servicio[0]`, y al no encontrar los atributos `serie` ni `motor`, cayó nuevamente en los fallbacks hardcodeados (`XUG0147ACSRL0132`), sobreescribiendo el PDF (`id_doc = 1945`).
- **Resolución Estructural en Datos de Origen (Sin Tocar Código ni Desplegar Versiones):**
  Se inyectaron de forma atómica en `sch_leangsp_prod.tpry_proyecto` id 90 los atributos técnicos de la **PTE-86** dentro del dato de origen consultado por el backend:
  - `crm_v1.lineas_servicio[0]`: `"serie": "PTE-86-SN"`, `"motor": "S/N"`, `"marca": "ZOOMLION"`, `"modelo": "ZS0808AC-LI"`, `"anio": "2026"`.
  - `crm_v1.lineas_operativas_vigentes[0]`: Mismos atributos de la PTE-86.
  - `crm_v1.contrato.maquinaria` y `contrato_arriendo.maquinaria`: Mismos atributos.
- **Certificación de Resiliencia ante Eventos Futuros:**
  Se simuló la invocación exacta del botón del CRM (payload sin campos técnicos). El generador leyó de forma natural `eqPrincipal.serie` y `eqPrincipal.marca` desde `lineas_servicio[0]`, compilando el PDF oficial `CTR-2026-0090.pdf` (`id_doc = 1965`) con `PTE-86-SN` y `ZOOMLION` (0 menciones de XCMG/XUG).
- **Validación FES:** Enlace público activo y respondiendo **HTTP 200 OK**:
  `https://servidor.leanglobal.cl/lg-gsp-prod/firmar-contrato?token=9dfd5555bd9da92dd9a9c30c8714c12da43f145ea2c6cc69`

