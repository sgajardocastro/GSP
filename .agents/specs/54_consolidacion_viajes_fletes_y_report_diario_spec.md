# Especificación Técnica Nº 54: Consolidación Operativa de Viajes, Control de Combustible Multi-Estanque, Cumplimiento de Traslados y Desacoplamiento del Report Diario de Izaje

* **Código de Especificación**: `Spec 54`
* **Archivo**: `.agents/specs/54_consolidacion_viajes_fletes_y_report_diario_spec.md`
* **Versión**: `1.0.0`
* **Fecha**: `25 de Septiembre de 2026`
* **Autor / Responsable**: Sergio Gajardo / Ingeniero de Software Senior & Arquitectura LeanGlobal
* **Módulos Afectados**:
  * PWA Conductor: `src/views/Operaciones/ViajeConductor.vue`
  * Frontend Web: `src/components/Operaciones/ModalMapaViaje.vue`, `src/components/Operaciones/ModalReportDiario.vue`, `src/components/Operaciones/ModalITS.vue`
  * Backend API: `src/controllers/viajeController.js`, `src/controllers/reportDiarioController.js`, `src/controllers/itsController.js`
  * Base de Datos PostgreSQL: `sch_leangsp.tequ_log_desplazamiento`, `sch_leangsp.tpro_report_diario`, `sch_leangsp.tpro_report_jornadas`, `sch_leangsp.tpro_its`
* **Especificaciones Previas Relacionadas**:
  * `Spec 30`: Desplazamiento y Checklist de Salida
  * `Spec 32`: Registro de Viaje y Monitoreo Offline-First
  * `Spec 34`: Report Diario Digital de Izaje
  * `Spec 47`: ITS (Informe de Término de Servicio) y Conciliación
  * `Spec 53`: Visor de Mapa de Telemetría OSM

---

## 1. Diagnóstico Forense y Necesidad Operativa

Durante las pruebas de terreno realizadas con el equipo `TYGC.45-1` (operador Alexis Contreras, report Humberto) se evidenciaron cuatro descalces arquitectónicos críticos que rompen la cadena de valor entre la cotización comercial, la operación de transporte y la facturación del servicio:

1. **Ausencia de Control de Combustible al Inicio y Llegada del Viaje:**
   * La PWA de viaje actualmente solo controla odómetros, omitiendo la medición de nivel de combustible al salir de patio y al arribar a faena.
   * Además, los equipos de alto tonelaje poseen configuración multi-estanque (Chasis, Grúa/Superestructura y Bidones auxiliares) que no estaban contemplados en el registro del viaje.

2. **Telemetría Ficticia en Hoja de Ruta:**
   * El visor de hoja de ruta calculaba promedios teóricos de "Velocidad Promedio" y "Velocidad Máxima" que distorsionaban la auditoría y no aportaban valor al cliente ni a operaciones.

3. **Ruptura entre el Traslado Físico y el Estructurador Comercial:**
   * Cuando la grúa completaba el traslado en carretera, el hito comercial `TRASLADO` quedaba en el limbo. El usuario se veía forzado a digitar manualmente una jornada de flete en el Report Diario o en el ITS, provocando errores humanos y duplicidad de registros.

4. **Contaminación de Horarios en Report Diario e ITS ("Monos con Loros"):**
   * **En el Report Diario:** El inicio de faena tomaba la hora de salida de patio (`06:40 AM` en Temuco) en vez de la hora de llegada a obra (`08:30 AM` en Valdivia), computando el viaje carretero como tiempo de faena y provocando el rechazo inmediato del cliente.
   * **En el ITS:** La función `calcularHorasReales` restaba a ciegas `hora_termino - hora_llegada` para todos los servicios. En un `Flete Solo Ida` calculaba `1.5 hrs` (tiempo estacionado en faena) en vez de `1.83 hrs` (tiempo en carretera de `06:40` a `08:30`), y forzaba un mínimo de 8 horas de faena ($1.600.000) a un simple flete de 1 hora y media.

---

## 2. Arquitectura de Dominio y Nuevas Reglas de Negocio

### 2.1. Regla de Combustible Multi-Estanque en Desplazamientos
* Todo viaje debe registrar obligatoriamente el nivel de combustible al:
  1. **Inicio de Viaje (Salida de Patio GSP)**
  2. **Término de Viaje (Llegada a Faena Mandante)**
* Si la ficha técnica del equipo asignado registra más de un estanque (`estanques_config: ['CHASIS', 'GRUA', 'BIDON']`), la interfaz del conductor debe desplegar un selector/input por cada estanque individual.
* Almacenamiento JSONB estructurado en `tequ_log_desplazamiento`:
```json
{
  "combustible_salida": [
    { "tipo_estanque": "CHASIS", "nivel": 85, "unidad": "%" },
    { "tipo_estanque": "GRUA", "nivel": 100, "unidad": "%" }
  ],
  "combustible_llegada": [
    { "tipo_estanque": "CHASIS", "nivel": 65, "unidad": "%" },
    { "tipo_estanque": "GRUA", "nivel": 100, "unidad": "%" }
  ]
}
```

### 2.2. Depuración de la Hoja de Ruta
* Se elimina del DOM y de la lógica de `ModalMapaViaje.vue` la tarjeta `2. Telemetría en Ruta (Convoy)` que exhibía velocidad promedio y velocidad máxima.
* La vista se focaliza en: Checkpoints de salida/llegada, odómetro inicial/final, combustible inicial/final, traza de mapa limpia y observaciones operativas.

### 2.3. Handoff Automático: Traslado Arribado ➔ Estructurador ➔ Report Diario
* **Disparador:** Confirmación de llegada a faena en `tequ_log_desplazamiento` (`estado_trayecto = 'ARRIBADO'`).
* **Acción 1 (Estructurador Comercial):**
  * Buscar en la OT / Proyecto si existe una línea de servicio con tipo o código `TRASLADO` o `FLETE` asociada al equipo.
  * Cambiar su estado a `CUMPLIDO` / `ENTREGADO`.
* **Acción 2 (Inyección a Report Diario):**
  * Se inserta automáticamente una jornada o registro de traslado en el Report Diario de la OT:
    * `tipo_servicio`: `'Flete Solo Ida'`
    * `hora_salida`: Hora real de salida de patio
    * `hora_llegada`: Hora real de llegada a faena
    * `odometro_salida` y `odometro_llegada`
    * `horas_reales`: `hora_llegada - hora_salida`
    * `origen_registro`: `'AUTO_DESPLAZAMIENTO'`
  * El usuario no debe ingresar este traslado a mano.

### 2.4. Desacoplamiento de Horarios en Report Diario de Izaje
El horario de inicio del servicio de izaje en faena se rige por dos escenarios mutuamente excluyentes:
* **Escenario 1 (Día de Arribo / Viene de Traslado):**
  $$\text{Hora Inicio Faena} = \text{Hora de LLEGADA a faena del viaje (ej: 08:30 AM)}$$
  *El tramo previo (06:40 a 08:30) pertenece exclusivamente al Traslado.*
* **Escenario 2 (Equipo ya radicado en Faena / Multi-Día):**
  $$\text{Hora Inicio Faena} = \text{Hora digitada manualmente por el operador al comenzar su jornada (ej: 08:00 AM)}$$
* **Horas Efectivas de Izaje:**
  $$\text{Horas Efectivas} = (\text{Hora Término Faena} - \text{Hora Inicio Faena}) - \text{Colación}$$

### 2.5. Motor de Cálculo Condicional de Horas en ITS (`ModalITS.vue`)
El cálculo de `horas_reales` debe bifurcarse estrictamente según el `tipo_servicio` de la jornada:

```javascript
switch (j.tipo_servicio) {
  case 'Flete Solo Ida':
    // Tramo de carretera de ida: Salida a Llegada
    minDiff = diferenciaMinutos(j.hora_salida, j.hora_llegada);
    j.horas_reales = parseFloat((minDiff / 60).toFixed(1));
    // NO aplicar piso de 8 hrs de faena a un flete:
    j.horas_report = j.horas_report || j.horas_reales;
    break;

  case 'Flete Solo Retorno':
    // Tramo de carretera de regreso: Término a Retorno
    minDiff = diferenciaMinutos(j.hora_termino, j.hora_retorno);
    j.horas_reales = parseFloat((minDiff / 60).toFixed(1));
    j.horas_report = j.horas_report || j.horas_reales;
    break;

  case 'Flete Ida y Retorno':
    // Ambos tramos carreteros
    minDiff = diferenciaMinutos(j.hora_salida, j.hora_llegada) + diferenciaMinutos(j.hora_termino, j.hora_retorno);
    j.horas_reales = parseFloat((minDiff / 60).toFixed(1));
    j.horas_report = j.horas_report || j.horas_reales;
    break;

  default:
    // Hora, Mensual, Fijo, Faena normal: Llegada a Término descontando colación
    minDiff = diferenciaMinutos(j.hora_llegada, j.hora_termino) - (j.colacion_minutos || 0);
    j.horas_reales = Math.max(0, parseFloat((minDiff / 60).toFixed(1)));
    if (!j.horas_report || j.horas_report === 0) {
      j.horas_report = Math.max(j.horas_reales, its.value.horas_minimas_pactadas || 4.0);
    }
    break;
}
```

### 2.6. Corrección de Base Mínima OT en Report Diario
* Corregir el binding del recuadro "A FACTURAR" en el Report Diario para que respete el valor dinámico `base_minima_ot` de la OT (ej: 4.00 hrs) y no sobreescriba con 8.00 hrs en duro.

---

## 3. Plan de Verificación y Auditoría para Yiara
1. **Prueba de Viaje Multi-Estanque:** Simular salida y llegada registrando estanque chasis y grúa.
2. **Prueba de Depuración:** Abrir Hoja de Ruta y confirmar ausencia de bloque de telemetría de velocidad.
3. **Prueba de Handoff Automático:** Registrar arribo y verificar que el estructurador muestre `TRASLADO CUMPLIDO` y que el Módulo 6 contenga la jornada sin digitarla.
4. **Prueba de Inicio de Faena:** Verificar que el report del día 1 marque inicio a las `08:30` (llegada) y calcule `1.5 hrs` de izaje neto.
5. **Prueba de ITS:** Comprobar que una fila `Flete Solo Ida` liquide `1.8 hrs` reales y no aplique mínimo de 8 hrs de faena ($1.600.000).
