# 📐 Especificación Técnica: Simplificación de Hoja de Ruta Móvil, Report Diario Secuencial y Flujo de Combustible Copec (Spec 49)

**Documento:** `49_simplificacion_viaje_y_report_secuencial_con_combustible_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fase 4 y 5 - Desplazamiento de Flota (`id_proyecto_estado = 4`) y Operación en Faena (`id_proyecto_estado = 5`)  
**Estado:** `ESTÁNDAR CANÓNICO APROBADO`  
**Versión:** `1.3.0` (Actualizado: 27 de Octubre de 2026)  
**Autor:** Sergio Gajardo (LeanGlobal) / Jorge Ponce - Omar Ghiselini (Grúas San Pablo)  

---

## 1. 📌 Resumen Ejecutivo y Diagnóstico Operacional

### 1.1. Contexto y Problema Detectado
En la prueba de campo y en la sesión de optimización operativa del 6 de octubre de 2026, la Dirección y Gerencia de Operaciones definieron la eliminación de fricción y sobrecarga de datos innecesarios para el operador en cabina y el cliente mandante en faena:
1. **Contaminación de Datos en Faena:** Exigir odómetros de carretera al firmar el Report Diario de faena genera confusión en el mandante (quien solo contrata y audita horas de izaje de la grúa, no kilometrajes de traslado).
2. **Desacople entre Chasis y Superestructura:** Las grúas móviles y camiones pluma poseen dos naturalezas mecánicas distintas:
   - **Mecanismo de Desplazamiento / Carretera (Chasis/Camión):** Controlado por Odómetro (Km) y Horómetro de Camión (horas motor de traslado). Físicamente residen en el chasis/cabina de conducción.
   - **Mecanismo de Izaje / Operacional (Superestructura/Grúa):** Controlado por el Horómetro de Grúa (computador LICCON / cabina de izaje).
3. **Registro Fotográfico Desacoplado (Multi-Foto Obligatoria):** Dado que el odómetro del camión, el horómetro del camión y el horómetro de la grúa no se encuentran en el mismo reloj ni en la misma cabina, el sistema DEBE permitir y exigir la captura de fotografías separadas e independientes por cada instrumento físico.
4. **Manejo Incorrecto de Servicios Multi-Día:** Cuando un servicio dura más de 1 día, el equipo pernocta en la faena del cliente y no se desplaza por carretera en los días intermedios. En consecuencia, en el Día 2 en adelante solo se registra el tiempo de inicio de faena, heredando el horómetro de izaje del día anterior, sin exigir datos cinemáticos de carretera.
5. **Estándar de Comunicación con el Operador:**
   - Queda terminantemente prohibido el término técnico "PWA". En todas las interfaces, afiches y manuales se debe llamar exclusivamente **"APP"** o **"Tu Aplicación en el Celular"**.
   - Locución guiada y síntesis de voz en español de Chile (`es-CL`).
6. **Protección contra Bucle en Hoja de Ruta de Retorno (Caso Finning / Natalia):** Al concluir el último report diario y activarse la Hoja de Ruta de Retorno, la interfaz de conducción `ViajeConductor.vue` DEBE propagar obligatoriamente `tipo_trayecto = 'RETORNO'`, calcular tiempos contra `fecha_salida_faena` y `fecha_llegada_patio`, suprimir toda invocación a `abrirFormularioReport()`, y al confirmar llegada en patio central pasar a `OPERACIONALMENTE_CONCLUIDO` y equipo `DISPONIBLE` con retorno al menú principal.
7. **Simplificación Operativa por Ámbito, Desacople Nativo APP y Rediseño de Report Diario (Sesión 27-Oct-2026):**
   - **Limpieza de Ámbito Operacional (`App.vue` & `Surveys.vue`):** La pestaña `Taller` en la barra inferior se restringe estrictamente al rol de taller/bodega (`v-if="esBodegaOTaller"`). En la vista de Operaciones (`Surveys.vue`) se eliminan `Control de Portón & Patio`, `Visita Técnica a Terreno`, `Checklists & Protocolos Asignados`, accesos duplicados a `Taller` y la tarjeta `Cotizador Express` (que permanece exclusivamente en la pestaña Comercial). Se corrige el contraste en modo claro/oscuro y se agranda la tipografía de todos los botones de acción.
   - **Desacoplamiento Total APP vs. Web:** `ViajeConductor.vue` y `viajeOfflineSync.js` se integran de forma 100% nativa en el router interno de la APP (`ejecucion/pwa/src/views/ViajeConductor.vue`, ruta `/viaje/:token`), eliminando cualquier redirección externa hacia la consola web (`/lg-gsp-prod/viaje/...`).
   - **Traslado del Horómetro Inicial de Grúa desde Llegada hacia Inicio Report y Eliminación de Horómetro Chasis al Cierre:** La Llegada a Faena solo cierra el tramo carretero del camión (Odómetro, Horómetro Camión y Combustible). El **Horómetro de Superestructura (con foto)** pasa a ser **100% obligatorio en el `INICIO REPORT`** y en el **`TERMINO DE REPORT`**, eliminándose definitivamente el Horómetro de Chasis y las notas mecánicas de taller del reporte diario.

---

## 2. 🏛️ Matriz Canónica de Instrumentos y Registro Fotográfico Independiente

La siguiente matriz representa la **Verdad Única y Normativa (SSoT)** sobre qué instrumentos, variables y fotografías deben ser capturados en cada instancia del ciclo operativo de terreno:

| Instrumento / Evidencia Fotográfica | 1. SALIDA<br>*(Patio Base GSP)* | 2. LLEGADA<br>*(Arribo a Faena)* | 3. INICIO REPORT<br>*(Inicio de Faena)* | 4. TERMINO DE REPORT<br>*(Cierre con Mandante)* | 5. RETORNO<br>*(Salida Faena a Base)* | 6. LLEGADA A BASE<br>*(Patio Central GSP)* |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **ODÓMETRO (Km)** | **[ X ]** (Foto 1) | **[ X ]** (Foto 1) | *No aplica* | *No aplica* | **[ X ]** (Foto 1) | **[ X ]** (Foto 1) |
| **HORÓMETRO CAMIÓN (Chasis)** | **[ X ]** (Foto 2) | **[ X ]** (Foto 2) | *No aplica* | *No aplica* | **[ X ]** (Foto 2) | **[ X ]** (Foto 2) |
| **HORÓMETRO GRÚA (Superestructura)** | *No aplica* | *No aplica* | **[ X ]** (Foto Inicio Obligatoria) | **[ X ]** (Foto Término Obligatoria) | *No aplica* | *No aplica* |
| **NIVEL DE COMBUSTIBLE** | *No aplica* | **[ X ]** (Foto 3) | *No aplica* | *No aplica* | *No aplica* | **[ X ]** (Foto 3) |
| **TOTAL FOTOGRAFÍAS REQUERIDAS** | **2 Fotos** | **3 Fotos** | **1 Foto** | **1 Foto** | **2 Fotos** | **3 Fotos** |

### 2.1. Reglas de Negocio Derivadas de la Matriz:

1. **Instancia 1: SALIDA DE PATIO (Inicio Traslado de Ida):**
   - **Qué se captura:** `Odómetro Salida` (Foto 1) + `Horómetro Camión Salida` (Foto 2) + `PIN`. Se elimina cualquier enlace externo de ayuda documental.
   - **Qué NO se captura:** `Horómetro Grúa` (la superestructura está apagada y trincada en su cuna de transporte).

2. **Instancia 2: LLEGADA A FAENA (Hito Bisagra Carretera ➔ Faena):**
   - **Qué se captura:** 
     - `Odómetro Llegada` (Foto 1), `Horómetro Camión Llegada` (Foto 2), `Nivel de Combustible` (Foto 3) y `PIN`: Cierran el tramo carretero de ida (`Km_Ida = Llegada - Salida`).
   - **Qué NO se captura en Llegada:** Se eliminan de esta pantalla el `Horómetro Grúa (Superestructura)`, el campo `Observaciones de Término / Ruta` y los enlaces de ayuda documental.
   - **Botón de Confirmación:** Texto único y grande: **`CONFIRMAR LLEGADA`**.
   - **Resumen al Cierre del Viaje (`ARRIBADO_FAENA`):** Una vez confirmada la llegada, se ocultan los cuadros superiores de resumen y fotografías de Salida y Arribo, mostrando **únicamente el cuadro resumen final inferior** con acción directa para ir al Report Diario o volver al menú principal.

3. **Instancia 3: INICIO REPORT (Inicio de Jornada en Faena):**
   - **Encabezado:** Dice exactamente **`INICIO REPORT`**, mostrando únicamente la patente del equipo asignado al operador (sin selector multi-máquina) y el badge de fecha/día con formato **`DD/MM/YYYY (DIA Y DE X)`**.
   - **Aislamiento de Fase:** Al estar en `INICIO REPORT`, se oculta el botón/pestaña de Fin de Faena. Se eliminan el subtítulo `"Registro de tableros inicio de faena"` y el selector de `"Fecha de la jornada"` (restringido a la fecha actual del sistema).
   - **Qué se captura:** `Hora de Inicio` mediante **teclado numérico directo (`HH : MM`)** (sin selector de reloj redondo) y **`Horómetro Superestructura (Inicio)` + Foto Obligatoria** con botón único **`FOTO HOROMETRO SUPERESTRUCTURA`**.
   - **Botón de Guardado:** Texto único: **`GUARDAR INICIO REPORT`**.

4. **Instancia 4: TERMINO DE REPORT (Cierre de Jornada y Firma Mandante):**
   - **Encabezado:** Dice exactamente **`TERMINO DE REPORT`**, manteniendo patente única y formato **`DD/MM/YYYY (DIA Y DE X)`**.
   - **Qué se captura:** `Hora Inicio` (rectificable con input numérico `HH : MM`, ocultando el horómetro inicial en la primera tarjeta), `Hora Término` (input numérico `HH : MM`), `Minutos Colación`, `Horas Standby`, **`Horómetro Superestructura (Término)` + Foto Obligatoria** (botón único **`FOTO HOROMETRO SUPERESTRUCTURA`**, sin etiqueta superior redundante `"Tomar foto"`), maniobras realizadas y `Firma Digital Mandante` (con Nombre, RUT y Cargo).
   - **Qué NO se captura:** **Cero Odómetro, Cero Horómetro de Chasis (eliminado definitivamente) y Cero Notas Mecánicas / Taller GSP**.
   - **Resumen de Tiempos y Regla de Standby:**
     - Se ocultan `"Jornada Total"` y `"Sobretiempo Devengado"`, mostrando únicamente **`HORA REPORT`** y **`HORA COLACIÓN`**.
     - Etiquetas de Standby estandarizadas y de alto contraste: **`STAND BY CLIENTE COBRABLE`** y **`STAND BY SAN PABLO FALLA EQUIPO SIN COBRO CLIENTE`**.
     - **Regla de Cálculo:** El `STAND BY CLIENTE COBRABLE` **NO rebaja** la `HORA REPORT`. Solo el `STAND BY SAN PABLO FALLA EQUIPO SIN COBRO CLIENTE` y la colación se descuentan de las horas brutas:
       $$\text{HORA REPORT} = \max(0, \text{Horas Brutas} - \text{Horas Colación} - \text{Standby San Pablo Falla Equipo})$$
   - **Fórmula de Cobro Diario:**
     $$\Delta \text{Horas Grúa} = \text{Horómetro Grúa Término} - \text{Horómetro Grúa Inicio}$$
     $$\text{Horas Facturables} = \max(\text{HORA REPORT}, \text{Piso Mínimo Contractual})$$

5. **Instancia 5: RETORNO (Salida Faena hacia Patio Base GSP):**
   - **Activación:** Se habilita **únicamente tras sellar el último report planificado del servicio** (`dia_correlativo === dias_planificados`).
   - **Qué se captura:** `Odómetro Retorno` + `Horómetro Camión Retorno` (+ PIN).
   - **Qué NO se captura:** `Horómetro Grúa` (equipo recogido para transporte).

6. **Instancia 6: LLEGADA A BASE (Patio Central GSP):**
   - **Qué se captura:** `Odómetro Llegada Base` + `Horómetro Camión Llegada Base` (+ porcentaje de combustible y checklist de patio).
   - **Efecto:** Cierra definitivamente el traslado de retorno, pasa el proyecto a `OPERACIONALMENTE_CONCLUIDO` (estado 6) y libera el equipo a estado `DISPONIBLE`.

---

## 3. 🔄 Comportamiento Operativo: 1 Día vs. Multi-Día

### 3.1. Caso A: Servicios de 1 Día (Día Único)
* **Secuencia Continua:**
  $$\text{1. Salida Base} \longrightarrow \text{2. Llegada Faena} \longrightarrow \text{3. Inicio Report} \longrightarrow \text{4. Termino de Report} \longrightarrow \text{5. Retorno Faena} \longrightarrow \text{6. Llegada Base}$$
* La **Llegada a Faena** cierra el viaje carretero del camión. Al pasar a **Inicio Report**, el operador registra la hora de inicio (numérica) y el `horometro_inicio` de superestructura con su foto obligatoria. Al finalizar la faena en **Termino de Report**, digita la hora de término, el `horometro_termino` de superestructura con su foto obligatoria, firma con el mandante y procede al Retorno.

### 3.2. Caso B: Servicios Multi-Día (2 o más Días en Faena)
* **Día 1:** Cumple pasos 1 (Salida) y 2 (Llegada). Ejecuta faena Día 1 y sella Report Día 1 con mandante. El equipo **pernocta en faena**. La PWA **no activa el Retorno**, sino que queda en estado *"En espera de Jornada Día 2"*.
* **Días Intermedios (Día 2 hasta Día $N-1$):**
  - El equipo **no se desplaza por carretera**; permanece estático en la obra del mandante.
  - **Inicio Report (`INICIO REPORT`):**
    - Se registra la **Hora de Inicio (`HH : MM` numérico)** y el **Horómetro Superestructura (Inicio) + Foto Obligatoria** (`FOTO HOROMETRO SUPERESTRUCTURA`), pre-poblado como sugerencia con el horómetro de cierre del día anterior:
      $$\text{Horómetro Grúa Inicio (Día } N) = \text{Horómetro Grúa Término (Día } N-1)$$
    - **No se solicita Odómetro ni Horómetro de Camión ni fotos de odómetro.**
  - **Término de Jornada (`TERMINO DE REPORT`):** Registra Hora Término (`HH : MM` numérico), Horómetro Superestructura Término + Foto Obligatoria y firma del mandante.
* **Día Final (Día $N$):**
  - Cumple `INICIO REPORT` y `TERMINO DE REPORT`.
  - Al sellar el Report del Día $N$, el sistema detecta que `dia_reportado === dias_planificados` y desbloquea el **Retorno a Base** y **Llegada a Base**.

---

## 4. 📱 Especificación Detallada de Pantallas Móviles (`ViajeConductor.vue` & `ReportDiarioIzaje.vue`)

### 4.1. Estado 1: `SALIDA_PATIO`
* **Condición de Activación:** `viaje.estado_viaje === 'ASIGNADO'`.
* **Propósito:** Certificar el inicio del convoy desde el patio central o base operacional de GSP.
* **Campos Requeridos (2 Fotografías Independientes):**
  1. `odometro_salida` (Decimal, obligatorio, ej: `145820.5` KM).
  2. `foto_odometro_salida` (`foto_odometro_salida_path` en BD, Base64/File JPEG, obligatorio vía cámara).
  3. `horometro_camion_salida` (Decimal, obligatorio, ej: `3240.2` HRS).
  4. `foto_horometro_salida` (`foto_horometro_salida_path` en BD, Base64/File JPEG, obligatorio vía cámara).
     * *Atajo ergonómico:* Botón `"Copiar foto del odómetro"` disponible solo si ambos relojes están integrados en el tacógrafo digital de la cabina.
  5. `pin_conductor` (Texto numérico, 4 dígitos exactos, obligatorio).
* **Campos Ocultos / Eliminados:** `horometro_grua` y enlaces de ayuda a documentación externa.

### 4.2. Estado 2: `EN_RUTA`
* **Condición de Activación:** `viaje.estado_viaje === 'EN_RUTA'`.
* **Propósito:** Guiar el tránsito sin distracciones y registrar eventos de carretera.
* **Acción Secundaria:** Botón azul: `[ ⛽ REGISTRAR CARGA DE COMBUSTIBLE (COPEC) ]`.
* **Acción Primaria de Arribo:** Botón gigante verde esmeralda: `[ 🏁 CONFIRMAR LLEGADA A FAENA ]`.

### 4.3. Estado 3: `LLEGADA_FAENA`
* **Condición de Activación:** Gatillado por el botón `[ 🏁 CONFIRMAR LLEGADA A FAENA ]` en `EN_RUTA`.
* **Propósito:** Certificar el arribo del camión a faena y cerrar el tramo carretero.
* **Campos Requeridos (3 Fotografías Independientes):**
  1. **Bloque 1 (Camión / Chasis):**
     * `odometro_llegada` (Decimal, obligatorio, $\ge$ `odometro_salida`).
     * `foto_odometro_llegada` (`foto_odometro_llegada_path` en BD, obligatorio vía cámara).
     * `horometro_camion_llegada` (Decimal, obligatorio, $\ge$ `horometro_camion_salida`).
     * `foto_horometro_camion_llegada` (`foto_horometro_camion_llegada_path` en BD, obligatorio vía cámara).
  2. **Bloque 2 (Combustible):**
     * `combustible_chasis` (Selección de nivel: 100%, 75%, 50%, 25%, Reserva).
     * `foto_combustible` (Fotografía de marcador de estanque, obligatoria).
  3. **Bloque 3 (Seguridad):**
     * `pin_conductor` (Texto numérico, 4 dígitos exactos, obligatorio).
* **Elementos Eliminados en Llegada:** `horometro_grua_llegada` y su foto, campo `Observaciones de Término / Ruta` y link de documentación de ayuda.
* **Botón de Acción Primaria:** Texto único con caracteres grandes: **`[ CONFIRMAR LLEGADA ]`**.
* **Vista de Cierre (`ARRIBADO_FAENA`):** Al confirmar llegada, se ocultan los resúmenes superiores con fotos de salida/arribo y se exhibe **únicamente el cuadro resumen final inferior** que permite ir al Report Diario o volver al menú.

### 4.4. Estado 4: `EN_FAENA` & `REPORT_DIARIO` (Report de Faena con Mandante)
* **Condición de Activación:** `viaje.estado_viaje === 'ARRIBADO_FAENA'`.
* **Principio Rector:** Erradicación total de campos de carretera, horómetro de chasis y notas de taller. El mandante únicamente firma horas de operación y horómetro de superestructura.
* **Encabezado Dinámico y Cabecera Simplificada:**
  - Título superior dinámico: **`INICIO REPORT`** (en Fase 1) y **`TERMINO DE REPORT`** (en Fase 2), reemplazando `"Control de Flota"`.
  - Patente única del equipo asignado al operador (se elimina el selector multi-máquina).
  - Badge de jornada con formato exacto: **`DD/MM/YYYY (DIA Y DE X)`** (ej. `27/10/2026 (DIA 1 DE 3)`).
* **Fase 1 — `INICIO REPORT`:**
  - Al iniciar el report solo se muestra la pantalla de inicio (se oculta el botón/selector de Fin de Faena).
  - Se eliminan el subtítulo `"Registro de tableros inicio de faena"` y el campo `"Fecha de la jornada"` (fijado a la fecha actual del sistema).
  - `hora_inicio`: Captura mediante **inputs numéricos directos (`HH` y `MM`)** con teclado numérico, reemplazando el reloj circular nativo.
  - `horometro_inicio` (Superestructura) + `foto_tablero_inicio`: **100% OBLIGATORIOS** (se elimina la etiqueta `"Opcional"` y los textos triplicados de sacar foto, dejando un único botón **`[ FOTO HOROMETRO SUPERESTRUCTURA ]`**).
  - Botón de acción primaria: **`[ GUARDAR INICIO REPORT ]`**.
* **Fase 2 — `TERMINO DE REPORT` (Sellar con Mandante):**
  - **Tarjeta de Inicio:** Conserva únicamente el `Horario de Inicio` editable (con input numérico `HH : MM`) y **oculta el Horómetro Inicial**.
  - `hora_termino`: Captura mediante **inputs numéricos directos (`HH` y `MM`)**.
  - **Resumen de Tiempos:** Se ocultan las tarjetas `"Jornada Total"` y `"Sobretiempo Devengado"`, conservando únicamente **`HORA REPORT`** (en lugar de Horas Efectivas) y **`HORA COLACIÓN`**.
  - **Horas Standby (Etiquetas y Cálculo):**
    * Etiquetas legibles de alto contraste: **`STAND BY CLIENTE COBRABLE`** y **`STAND BY SAN PABLO FALLA EQUIPO SIN COBRO CLIENTE`**.
    * El `STAND BY CLIENTE COBRABLE` **NO se descuenta** de `HORA REPORT`; únicamente el `STAND BY SAN PABLO FALLA EQUIPO SIN COBRO CLIENTE` rebaja las horas del report.
  - `horometro_termino` (Superestructura) + `foto_horometro`: **100% OBLIGATORIOS**, con botón único **`[ FOTO HOROMETRO SUPERESTRUCTURA ]`** (sin etiqueta superior redundante `"Tomar foto"`).
  - `maniobra_detalle`, `mandante_nombre`, `mandante_rut`, `mandante_cargo` y `firma_mandante` (Lienzo Canvas `SignatureField.vue`).
  - **Botón de Acción Primaria:** **`[ TERMINO DE REPORT ]`**.
* **Campos Erradicados Definitivamente:** `odometro_inicio`, `odometro_termino`, `horometro_chasis_termino` (y su foto), selector multi-máquina y bloque `Notas Mecánicas / Taller GSP (Uso Interno)`.
* **Arquitectura de Pantalla en Faena:**
  1. **Cabecera Operacional Compacta:**
     * Patente y modelo de grúa (`BGDF.90 • LTM-1220`).
     * Obra / Faena (`Minera Los Pelambres`).
     * Botón compacto superior derecho: `[ ⛽ Combustible ]` (abre modal Copec/Aljibe).
  2. **Barra Plegable de Días Previos (Si existen reports firmados):**
     * Barra compacta: `[ 📋 N report(s) firmado(s) en esta faena — Ver ]`. Al tocarla, despliega la lista colapsable con los comprobantes de días anteriores.
  3. **Formulario de Report Diario Activo (Protagonista Inmediato):**
     * El formulario del día actual (Día N) se presenta **abierto de forma inmediata**, sin obligar al operador a hacer scroll ni a pulsar un botón previo de "abrir formulario".
     * Todos los campos numéricos configuran `inputmode="decimal"` o `inputmode="numeric"` para desplegar teclado numérico táctil en Android/iOS.
     * **Horómetro Inicial:** Precargado automáticamente (heredado del día anterior o de llegada).
     * **Horómetro Término:** Input grande con `inputmode="decimal"`.
     * **Colación Rápida:** Chips táctiles de 1 toque (`0m`, `30m`, `45m`, `60m`).
     * **Cálculo Reactivo:** Horas efectivas y horas facturables (piso mínimo 8.0h).
     * **Maniobra Realizada:** Textarea limpio para detalle técnico.
     * **Datos Mandante & Firma Touch:** Nombre, RUT, Cargo y lienzo Canvas `SignatureField.vue`.
     * **Botón Gigante:** `[ 🟢 SELLAR Y TRANSMITIR REPORT DÍA N ]`.
     * **Salida Inmediata:** Despliega el comprobante sellado en modal y ofrece continuar la faena.
  6. `hora_termino` (Hora `HH:MM`, obligatorio, por defecto `18:00`).
  7. `colacion_minutos` (Entero minutos; botones rápidos: `0m`, `30m`, `45m`, `60m`, por defecto `60m`).
  8. `maniobra_detalle` (Texto obligatorio; descripción técnica de izajes, tonelajes, interferencias o condiciones climáticas).
  9. `mandante_nombre` (Texto obligatorio; nombre y apellido del supervisor/ITO mandante).
  10. `mandante_rut` (Texto obligatorio; RUT del supervisor mandante con formato `XX.XXX.XXX-X`).
  11. `mandante_cargo` (Texto obligatorio; cargo del mandante, ej: `ITO / Supervisor de Maniobras`).
  12. `firma_mandante` (String Base64 PNG; trazo manuscrito capturado en el lienzo táctil `SignatureField.vue`).
* **Fórmulas Reactivas de Cálculo:**
  $$\text{min\_brutos} = (\text{hora\_termino} - \text{hora\_inicio}) \text{ en minutos}$$
  $$\text{min\_efectivos} = \max(0, \text{min\_brutos} - \text{colacion\_minutos})$$
  $$\text{horas\_efectivas} = \text{round}\left(\frac{\text{min\_efectivos}}{60}, 1\right)$$
  $$\text{horas\_facturables} = \max(\text{horas\_efectivas}, 8.0) \quad \text{(Garantía contractual de 8 hrs mínimas)}$$
  $$\Delta \text{horometro\_motor} = \text{round}(\text{horometro\_final} - \text{horometro\_inicio}, 1)$$
* **Acción Primaria:** Botón gigante esmeralda: `[ 🟢 SELLAR Y TRANSMITIR REPORT DÍA N ]`.
* **Resultado Inmediato:** Cierra el formulario, persiste localmente en `IndexedDB`, envía al backend o encola mutación si no hay red, y despliega el **Modal Comprobante Limpio de Report Diario** con la firma estampada.

### 4.5. Estado 5: `RETORNO` (Salida de Faena hacia Patio Base San Pablo)
* **Condición de Activación:** Se desbloquea automáticamente al sellar el último report de faena (`dia_correlativo === dias_planificados`).
* **Propósito:** Iniciar el traslado carretero de retorno hacia Santiago / Base Central.
* **Campos Requeridos:**
  1. `odometro_retorno` (Decimal, obligatorio; lectura de odómetro al salir de la obra).
  2. `horometro_camion_retorno` (Decimal, obligatorio; lectura motor chasis al iniciar viaje de vuelta).
  3. `pin_conductor` (Texto numérico, 4 dígitos exactos, obligatorio).
* **Campos Ocultos:** `horometro_grua` (prohibido solicitarlo; pluma en cuna).
* **Acción Primaria:** Botón gigante violeta: `[ 🏁 INICIAR VIAJE DE RETORNO A BASE ]`.

### 4.6. Estado 6: `LLEGADA_BASE` (Arribo a Patio Central GSP y Cierre de Convoy)
* **Condición de Activación:** Gatillado al arribar al portón de Patio Central San Pablo.
* **Propósito:** Cierre total del viaje de retorno, verificación de estanque y liberación de flota.
* **Campos Requeridos:**
  1. `odometro_llegada_base` (Decimal, obligatorio; $\ge$ `odometro_retorno`).
  2. `horometro_camion_llegada_base` (Decimal, obligatorio; $\ge$ `horometro_camion_retorno`).
  3. `porcentaje_combustible` (Selector numérico 1% a 100% de nivel de estanque).
  4. `foto_tablero_llegada_base` (Base64 JPEG comprimido del marcador de combustible y tacógrafo).
  5. `checklist_patio_recepcion` (Inspección visual de portón).
* **Campos Ocultos:** `horometro_grua`.
* **Acción Primaria:** Botón gigante verde esmeralda: `[ 🏁 FINALIZAR SERVICIO Y LIBERAR EQUIPO ]`.
* **Efecto Transaccional:**
  * Transición de proyecto a `OPERACIONALMENTE_CONCLUIDO` (estado 6).
  * Equipo pasa automáticamente a `DISPONIBLE` en maestro de flota.
  * Habilita la liquidación final en Mesa ITS y EDP.

---

## 5. ⛽ Módulo Permanente de Carga de Combustible (Copec)

### 5.1. Disponibilidad Ubicua
El registro de combustible no pertenece a un estado único; debe ser invocable mediante un modal flotante accesible en:
1. `EN_RUTA` (Carga en estaciones de servicio de carretera con tarjeta Copec habilitada).
2. `EN_FAENA` (Carga en obra mediante camión aljibe o servicentro local).

### 5.2. Flujo y Campos del Modal de Combustible
El modal maneja un ciclo rápido de rendición:
1. `odometro` (Decimal KM, obligatorio).
2. `horometro` (Decimal HRS, obligatorio).
3. `tipo_estanque` (Selector: `PRINCIPAL_CHASIS` o `SUPERESTRUCTURA_GRUA`).
4. `litros` (Decimal litros cargados, obligatorio, ej: `250.5` L).
5. `monto` (Entero \$ CLP total factura/voucher, obligatorio, ej: `\$312.500`).
6. `foto_voucher` (Foto obligatoria del ticket / comprobante de la bomba Copec).
7. `foto_tablero` (Foto opcional del marcador de combustible en tablero).

### 5.3. Persistencia de Combustible
* Los registros de combustible se apilan en el arreglo `viaje.cargas_combustible[]`.
* Se transmiten de forma asíncrona hacia el backend mediante la mutación `CARGA_COMBUSTIBLE`.

---

## 6. 📲 Protocolo de Mensajería WhatsApp Secuencial

El microservicio Baileys desplegado en `servidor.leanglobal.cl:3085` (`gsp-whatsapp`) gestiona los dos envíos oficiales:

### 6.1. Mensaje 1: Despacho de Viaje (Inicio de Servicio)
* **Disparador:** 
  * Automático al autorizar salida en Torre de Control CRM (`GestorOportunidades.vue`), o manual mediante botón `[ 📲 Despachar WhatsApp Viaje ]`.
* **Destinatario:** Teléfono del chofer asignado extraído de `sch_leangsp.tsec_users.movil`.
* **Estructura del Mensaje:**
```text
🚜 *Grúas San Pablo — Despacho Operacional*

¡Hola {chofer_nombre}! Has sido asignado al servicio de izaje en faena.

📋 *OT:* {codigo_proyecto}
🚜 *Equipo:* {tipo_equipo} {modelo} ({patente})
📍 *Faena:* {obra_nombre} • {obra_direccion}

📲 *Accede a tu Hoja de Ruta móvil aquí:*
https://servidor.leanglobal.cl/lg-gsp-dev/viaje/{token_viaje}

💡 *Instrucciones:* Al salir de base, ingresa al enlace para registrar odómetro, horómetro y PIN de salida.
```

### 6.2. Mensaje 2: Recordatorio de Report Diario (Cierre de Jornada)
* **Disparador:**
  * Tarea programada (Cron) en servidor ejecutada diariamente a las **17:30 hrs** (Lunes a Sábado), consultando servicios con estado `EN_FAENA` que no registren report sellado en la fecha actual.
  * Disparador manual 1-Click desde Torre de Control CRM: botón `[ 📲 Recordar Report Diario ]`.
* **Destinatario:** Teléfono del chofer asignado en faena.
* **Estructura del Mensaje:**
```text
📋 *Grúas San Pablo — Report Diario de Izaje*

¡Hola {chofer_nombre}! Recuerda registrar y firmar el Report Diario de hoy.

🚜 *Equipo:* {modelo} ({patente})
📍 *Faena:* {obra_nombre}
📅 *Jornada:* {fecha_hoy}

✍️ *Abre el formulario y haz que el supervisor mandante firme aquí:*
https://servidor.leanglobal.cl/lg-gsp-dev/viaje/{token_viaje}?fase=reporte

💡 *Instrucciones:* Completa el horómetro de término, selecciona el tiempo de colación y solicita la firma manuscrita al ITO mandante en tu pantalla.
```

---

## 7. 🛡️ Delimitación de Responsabilidades: Móvil vs. Torre de Control CRM

| Elemento / Característica | Móvil Chofer (`ViajeConductor.vue`) | Torre de Control CRM (`GestorOportunidades.vue`) |
| :--- | :---: | :---: |
| **Pings GPS en tiempo real (segundos)** | ❌ Oculto (Corre en background) | ✅ Visible (Panel telemetría + Mapa Leaflet) |
| **Coordenadas Lat/Lng crudas** | ❌ Oculto | ✅ Visible |
| **Filtro Deadband Haversine** | ❌ Oculto (Lógica interna) | ✅ Visible en auditoría |
| **Hashes Criptográficos SHA-256** | ❌ Oculto | ✅ Visible en bitácora de trazabilidad |
| **Log Maestro 7 Dimensiones** | ❌ **ERRADICADO TOTALMENTE** | ✅ Visible en Pestaña Operaciones |
| **Descarga de PDF de Auditoría Completo** | ❌ Oculto | ✅ Botón oficial de descarga |
| **Comprobante Resumido de Report Diario** | ✅ Visible (Modal amigable con firma) | ✅ Visor documental formal |
| **Botones Gigantes de Acción Única** | ✅ Obligatorio por ergonomía | ❌ (Usa controles de escritorio) |
| **Firma Manuscrita Mandante en Pantalla** | ✅ Lienzo Canvas táctil | ❌ Solo visualización de la firma capturada |

---

## 8. 🧪 Plan de Verificación y Criterios de Aceptación (QA)

1. **Prueba de Ergonomía Móvil (Zero Technical Clutter):**
   * En ningún estado el operador ve hashes, coordenadas crudas, tablas de pings ni el bloque "Log Maestro".
   * Los 5 estados se suceden de forma lineal, clara y sin ambigüedades.
2. **Prueba de Combustible Ubicuo:**
   * El modal de combustible abre y guarda registros tanto en estado `EN_RUTA` como en estado `ARRIBADO_FAENA`.
3. **Prueba de Report Diario Multi-Día:**
   * Al emitir el Report del Día 1, el Horómetro Final queda registrado.
   * Al abrir el Report del Día 2, el Horómetro Inicial hereda automáticamente el valor final del Día 1.
   * El cálculo de horas efectivas descuenta exactamente la colación y garantiza el mínimo de 8.0 horas facturables.
   * La firma táctil se dibuja fluidamente con el dedo y se almacena en Base64 PNG.
4. **Prueba de Mensajería WhatsApp:**
   * El endpoint `/enviar` despacha el mensaje con código HTTP 200 y mensaje ID de Baileys.
   * El enlace recibido en WhatsApp abre directamente la aplicación en el navegador del celular sin requerir inicio de sesión.
5. **Prueba de Resiliencia Offline:**
   * Al desconectar la red (Modo Avión), el chofer puede completar cualquiera de los 5 estados o registrar combustible; los datos se almacenan en `IndexedDB` y se sincronizan al restablecer la conexión.

---
**FIN DE LA ESPECIFICACIÓN TÉCNICA (SPEC 49)**
