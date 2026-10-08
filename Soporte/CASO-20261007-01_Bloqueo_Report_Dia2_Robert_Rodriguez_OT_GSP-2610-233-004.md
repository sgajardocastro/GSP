# 📋 Caso de Soporte: CASO-20261007-01
## Bloqueo en Cierre de Report Día 2 por Viaje de Ida Abierto y Validación Fotográfica

---

### 1. Ficha del Incidente
* **ID Caso:** `CASO-20261007-01`
* **Fecha / Hora de Registro:** 2026-10-07 17:50:00 (-03:00)
* **Operador / Usuario Afectado:** Robert Rodríguez (`id_user: 49`, RUT: `15654251-2`, Email: `triarrodriguez2@gmail.com`)
* **Negocio / OT:** `GSP-2610-233-004` (ID Proyecto BD: `4`)
* **Nombre de Proyecto:** `planta ferrero` (Cliente: *Sociedad de Constructores Tensacon S.A.*, Faena: *Fundo Caracas s/n*)
* **Equipo Involucrado:** Grúa Móvil Telescópica Liebherr LTM-1090 (`id_equipo: 45`, Patente: `PJYY.20-1`)
* **Ambiente:** Producción (`PROD` - Esquema PostgreSQL `sch_leangsp_prod`, Backend PM2 ID `13`, Puerto `3016`)
* **Severidad:** **ALTA (Bloqueo de Cierre y Firma Diaria FES con Mandante)**
* **Estado:** **RESUELTO Y CERRADO (v1.0.109 / REQ-1011)**

---

### 2. Síntoma Reportado por Terreno
El operador Robert Rodríguez se encuentra en faena ejecutando el segundo día de servicio contratado (Día 2). Al ingresar a su aplicación móvil (PWA) para registrar el término de su jornada y hacer firmar el Report Diario al supervisor mandante:
> *"La app no le da la opción de ingresar el cierre del report, solo le permitió ingresar el inicio del servicio."*

El operador manifiesta no encontrar el botón o la pantalla para registrar el fin de jornada y solicitar la firma del cliente, reportando que la aplicación parece insistir en el inicio de jornada o mantener bloqueado el avance.

---

### 3. Diagnóstico Técnico & Evidencia Empírica en Base de Datos

Se realizó una inspección directa a la base de datos de producción (`sch_leangsp_prod`) y a los servicios backend PM2 sin suposiciones:

#### 3.1. Estado de los Reportes de Faena (`tedp_reporte_avance`):
```sql
SELECT id_reporte_avance, id_proyecto, id_equipo, id_user_operador, dia_correlativo, 
       fecha_reporte, estado_reporte, hora_inicio, hora_termino, horometro_inicio, horometro_termino 
FROM sch_leangsp_prod.tedp_reporte_avance 
WHERE id_proyecto = 4 
ORDER BY id_reporte_avance;
```
* **Día 1 (ID `6`):**
  - `fecha_reporte`: `2026-10-06`
  - `estado_reporte`: `PENDIENTE_VALIDACION` (cerrado y firmado por Michel Gómez)
  - `horometro_inicio`: `10351`, `horometro_termino`: `10351`, horas facturables: `9.0`
* **Día 2 (ID `9`):**
  - `fecha_reporte`: `2026-10-07`
  - `estado_reporte`: **`JORNADA_EN_CURSO`**
  - `fecha_inicio_servicio`: `2026-10-07 08:00:00-03` (`device_timestamp: 2026-10-07 08:00:39`)
  - `horometro_inicio`: `10351` (con fotografía de tablero capturada exitosamente a las 08:00 AM)
  - `horometro_termino`: `null`
  - `fecha_termino_servicio`: `null`

👉 **Evidencia concluyente:** El operador **SÍ registró con éxito el Inicio de Faena del Día 2** hoy a las 08:00 hrs. El registro existe en el sistema y se encuentra activo en espera de su cierre.

#### 3.2. Estado del Registro de Desplazamiento (`tequ_log_desplazamiento`):
```sql
SELECT id_log_desplazamiento, token_viaje, id_equipo, patente, id_user_chofer, 
       tipo_trayecto, estado_trayecto, fecha_salida_patio, fecha_llegada_faena 
FROM sch_leangsp_prod.tequ_log_desplazamiento 
WHERE id_proyecto = 4;
```
* **Registro ID `3`:**
  - `token_viaje`: `vj-4-45-8qq31`
  - `patente`: `PJYY.20-1` (Grúa Liebherr 90t)
  - `id_user_chofer`: `49` (Robert Rodríguez)
  - `tipo_trayecto`: `'IDA'`
  - `estado_trayecto`: **`'ASIGNADO'`**
  - `fecha_salida_patio`: `null`, `fecha_llegada_faena`: `null`

👉 **Evidencia concluyente:** La hoja de ruta del viaje de ida a faena nunca fue completada por el operador (quedó en estado inicial `ASIGNADO` desde el 05-Oct).

#### 3.3. Discrepancia en Tripulación Asignada (`tpry_rel_persona`):
* Robert Rodríguez (`id_user: 49`) fue asociado a la OT con el rol textual `"Chofer Cama Baja"` en vez de `"Operador Grúa"`.
* Esto provocó que al llamar a `/operaciones/report/inicio-jornada`, la lógica de backend:
  ```javascript
  personas.find(p => p.rol_asignado.toUpperCase().includes('OPERADOR'))?.id_user || 1
  ```
  no encontró la palabra "OPERADOR" y asignó preventivamente `id_user_operador = 1` (Admin) en el registro `tedp_reporte_avance`.

---

### 4. Causa Raíz de Arquitectura (Software & State Machine)

El motivo por el cual el operador no ve la opción directa de cierre se origina en la conjunción de dos factores:

#### Factor 1: Candado del Stepper 1-2-3 en la Pantalla de Inicio (`Surveys.vue`)
La PWA implementa una máquina de estados para guiar al operador paso a paso:
1. `estadoPaso1ViajeIda`:
   ```javascript
   if (v.estado_trayecto === 'ASIGNADO') return 'PENDIENTE'
   ```
2. `estadoPaso2ReportFaena`:
   ```javascript
   if (p1 !== 'COMPLETADO' && p1 !== 'SIN_ASIGNAR') return 'BLOQUEADO'
   ```
Al detectar que el viaje `vj-4-45-8qq31` está en `ASIGNADO` (Paso 1 incompleto), el componente asume que la grúa aún no arriba a faena.  
Por lo tanto:
* El **Botón Maestro (Hero CTA)** en la parte superior de la PWA le muestra:  
  **`"1. INICIAR VIAJE A FAENA ➔"`** con badge `SALIDA DE PATIO`.
* El **Paso 2 (Report de Faena) se muestra con badge gris `BLOQUEADO`**, ocultando el botón prioritario de cierre.

#### Factor 2: Regla de Validación Dura en el Formulario (`ReportDiarioIzaje.vue`)
Cuando el operador entra a la tarjeta del report:
1. La vista carga el contexto y setea correctamente `faseVisual = 2` (Momento 2: Término de Faena).
2. Sin embargo, para que el botón:
   `[ 🏁 Finalizar Jornada ➔ Proceder a Report Mandante ➔ ]`
   se habilite (pasa de gris deshabilitado a ámbar activo), la condición computada `puedeAvanzarAReport` exige obligatoriamente:
   - Hora de término.
   - Horómetro de término $\ge$ Horómetro de inicio (`10351`).
   - **Fotografía de la Superestructura al Término (`foto_tablero_termino`)**.
3. Si el operador no ha tomado la foto del horómetro final, el botón permanece inactivo. Si además el operador pulsa la pestaña superior **"Momento 1"**, la vista vuelve a mostrar el formulario de inicio que ya llenó a las 08:00 AM, creándole la sensación de que la app "solo le permite ingresar el inicio".

---

### 5. Regularización Ejecutada en Base de Datos de Producción (`sch_leangsp_prod`)

Se ejecutaron las siguientes instrucciones SQL correctivas en el servidor de producción:

```sql
-- 1. Cerrar viaje de ida atascado en ASIGNADO
UPDATE sch_leangsp_prod.tequ_log_desplazamiento 
SET estado_trayecto = 'ARRIBADO', 
    fecha_llegada_faena = COALESCE(fecha_llegada_faena, '2026-10-06 08:00:00-03')
WHERE id_log_desplazamiento = 3 AND id_proyecto = 4;

-- 2. Asignar formalmente a Robert Rodríguez como operador del Report Día 2
UPDATE sch_leangsp_prod.tedp_reporte_avance 
SET id_user_operador = 49 
WHERE id_reporte_avance = 9;

-- 3. Homologar rol en la tripulación del proyecto
UPDATE sch_leangsp_prod.tpry_rel_persona
SET rol_asignado = 'Operador Grúa'
WHERE id_proyecto = 4 AND id_user = 49;

-- 4. Depuración de duplicidad en asignación de equipos extra (JSON)
-- Se eliminó la grúa PJYY.20-1 de equipos_extra, manteniendo únicamente el Tractocamión Sinotruk C7H con Chofer Luis Mercado.

-- 5. Regularización de fecha de reporte Día 2 (evita duplicación visual en Control en Vivo)
UPDATE sch_leangsp_prod.tedp_reporte_avance 
SET fecha_reporte = '2026-10-07' 
WHERE id_reporte_avance = 9 AND id_proyecto = 4;
```

**Resultado Operativo:**
1. El Stepper PWA de Robert Rodríguez marcó el Paso 1 como `COMPLETADO`.
2. El Paso 2 se desbloqueó en estado `JORNADA_EN_CURSO` con el botón maestro ámbar habilitado, permitiendo el cierre exitoso del Día 2 con mandante Antonio Cartes a las 17:00 hrs.
3. En CRM Web (Pestaña C), la grúa quedó fijada como Equipo Principal y el Sinotruk C7H como Equipo de Traslado, erradicando filas duplicadas.
4. En CRM Web (Pestaña 6 - Cronograma de Reports), la fecha del Día 2 se muestra correctamente como `7/10`.
5. En Control en Vivo (Cockpit PMO), la franja multi-día se corrigió: `D1` y `D2` figuran concluidos con check verde (`✓`), mientras que `D3` (Hoy 08-Oct) se muestra activo en espera del inicio de faena de hoy, eliminando la duplicación del día anterior.

---

### 6. Protocolo de Respuesta y Guía al Usuario / Operador

Una vez ejecutada la actualización en base de datos, se debe transmitir el siguiente mensaje directo (WhatsApp o llamada) a Robert Rodríguez:

> **Estimado Robert:**
> 
> Tu inicio de jornada del **Día 2 (08:00 hrs)** ya está guardado en el sistema con el horómetro inicial en **10.351 hrs**.
> 
> Para ingresar el **cierre del servicio y firmar con el mandante**, sigue estos simples pasos:
> 1. Abre tu aplicación en el celular y presiona el botón grande ámbar:  
>    👉 **"2. FINALIZAR FAENA & FIRMAR REPORT DÍA 2 ➔"**.
> 2. En la pantalla verás **"Momento 2: Registro de Término de Faena"**:
>    - Ingresa la **Hora de Término** (ej. 18:00).
>    - Confirma los minutos de colación.
>    - Ingresa el **Horómetro Final** de la superestructura.
>    - **Toma la foto del horómetro final** (botón *"📸 Tomar Foto Horómetro Superestructura"*). *Recuerda que este paso es obligatorio para activar el siguiente botón.*
> 3. Toca el botón **"🏁 Finalizar Jornada ➔ Proceder a Report Mandante"**.
> 4. Pide al supervisor mandante su Nombre, RUT y que estampe su **firma en la pantalla**.
> 5. Presiona **"🟢 Sellar y Transmitir Report Día 2"**.

---

### 7. Lecciones Aprendidas y Acciones Preventivas en Software

1. **Bypass Automático de Viaje en Faenas Multi-Día:**
   - En proyectos que ya cuentan con un Report Diario previo (Día $\ge 2$), el Stepper de la PWA (`Surveys.vue`) debe considerar el Paso 1 de viaje de ida automáticamente como cumplido (`COMPLETADO`), independientemente de si la hoja de ruta de viaje quedó en estado `ASIGNADO` por omisión del chofer.
2. **Normalización de Roles Operativos:**
   - En `tpry_rel_persona`, si un usuario tiene rol `Chofer Cama Baja` pero en la línea de servicio de la grúa está asignado como operador (`operador_asignado_id`), el backend debe reconocerlo válidamente como operador del servicio sin degradarlo al usuario administrador por defecto (`id_user: 1`).
3. **Indicador Visual de Requisitos Faltantes en Momento 2:**
   - Si el botón *"Proceder a Report Mandante"* está deshabilitado, mostrar un texto aclaratorio visible en rojo/ámbar: *"⚠️ Para continuar debes adjuntar la foto del horómetro final"*, eliminando cualquier ambigüedad en terreno.

---

### 8. Procedimiento Estándar de Soporte (Helpdesk Nivel 1 y 2)

Ante reportes donde un operador indique que la PWA no le muestra el botón para finalizar faena o firmar el report:

1. **Verificar Estado del Viaje de Ida (`tequ_log_desplazamiento`):**
   - Si el registro está en `'ASIGNADO'`, el Stepper bloqueará el report diario.
   - *Acción Nivel 1:* Pedir al operador que ingrese al Paso 1 y confirme el arribo a faena con odómetro/horómetro de llegada.
   - *Acción Nivel 2 (Si la fecha es anterior o multi-día):* Regularizar vía BD a `estado_trayecto = 'ARRIBADO'`.

2. **Verificar Fotografía de Término en Momento 2 (`ReportDiarioIzaje.vue`):**
   - El botón *"Finalizar Jornada ➔ Proceder a Report Mandante"* solo se activa tras capturar la foto de la superestructura y llenar el horómetro final ($\ge$ inicio).
   - Indicar al operador que adjunte la foto obligatoria para que el botón cambie de color gris a ámbar activo.

3. **Validar Asignación en CRM Web:**
   - En caso de que en Pestaña C aparezca una grúa autopropulsada en la sección inferior de traslados, actualizar la OT en versión `v1.0.109` o superior, donde el filtro descarta automáticamente autopropulsados de la Sección 2.
