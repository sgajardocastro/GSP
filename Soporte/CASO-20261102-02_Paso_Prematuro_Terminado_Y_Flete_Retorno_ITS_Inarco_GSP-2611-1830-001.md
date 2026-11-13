# Ficha de Incidente de Soporte Operacional — CASO-20261102-02

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261102-02`
- **Fecha / Hora:** 2026-11-02 15:00 CLT (UTC-3)
- **Operador / Usuario Afectado:** Yiara Mendoza (`Control de Gestión PMO`) / Operador ID `24` (Constructora Inarco)
- **Negocio / OT:** `GSP-2611-1830-001` (`id_proyecto = 27` — *"624 TALLERES Y COCHERAS TREN ALAMEDA"*, Cliente: Constructora Inarco)
- **Equipo Involucrado:** Grúa Telescópica 70 Ton (`STDD.68-4`, `id_equipo = 38`)
- **Ambiente:** Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`)
- **Severidad:** Crítica (Cierre prematuro de servicio mensual de 30 días en Día 1 e inyección prematura de Flete Solo Retorno en ITS)

---

## 2. Síntoma Reportado por Terreno
- El operador en terreno no había ingresado el Report Diario del Día 1 (`2026-11-02`), por lo que Yiara (Control de Gestión) ingresó manualmente el report registrando **únicamente el inicio de la jornada** (`08:00`, horómetro inicial `14040`), sin hora de término real ni documento físico adjunto.
- Apenas guardó el registro:
  1. El servicio (`GSP-2611-1830-001`, pactado por **30 días** del `2026-11-01` al `2026-11-30`) pasó automáticamente a estado **Terminado (Columna 6)**.
  2. Al abrir el **Informe de Término de Servicio (ITS)**, aparecían cargados tanto el **`Flete Solo Ida`** como el **`Flete Solo Retorno`**, a pesar de que el flete de retorno aún no se ha ejecutado.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
- **Inspección en `sch_leangsp_prod.tpry_proyecto` (`id_proyecto = 27`):**
  - `duracion_plan = NULL`, `crm_v1.fecha_hora_inicio = "2026-11-01T08:00"`, `crm_v1.fecha_hora_termino = "2026-11-30T18:00"`.
  - Línea comercial 1 (`GRUAS TELESCOPICAS` - `GRUA 70 TON`): `"unidad": "Horas Mes Minimas"`, `"cantidad_meses": 1`, `"pisoMinimo": 170`, `"cantidad_dias": 1`, `"cantidad": 1`, `"fecha_plan_ini": "2026-11-01"`, `"fecha_plan_fin": "2026-11-30"`.
  - Línea comercial 2 (`TRASLADOS` - `GRUA 70 TON`): `"unidad": "TRASLADO IDA/VUELTA"`, `"cantidad": 1`, `"valorUnitario": 1500000`.
- **Inspección en `sch_leangsp_prod.tedp_reporte_avance` (`id_reporte_avance = 2`):**
  - `fecha_inicio_servicio = '2026-11-02T11:00:00.000Z'` (`08:00` local), `fecha_termino_servicio = '2026-11-02T21:00:00.000Z'` (`18:00` autocompletado por backend), `horometro_inicio = 14040.00`, `horometro_termino = NULL`, `horas_operadas = 9.00`, `horas_facturables = 9.00`, `estado_reporte = 'REGULARIZADO_MANUAL'`, `estado_jornada = 'CONCLUIDO'`.
- **Inspección en `sch_leangsp_prod.tequ_log_desplazamiento` (`id_proyecto = 27`):**
  - Registro `id_log_desplazamiento = 3`: `tipo_trayecto = 'IDA'`, `estado_trayecto = 'ARRIBADO'`, `patente = 'STDD.68-4'`, `km_inicial = 70789.00`, `horometro_grua_inicial = 14040`. No existe ningún viaje `RETORNO`.

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Cálculo incompleto de `duracion_plan` en `proyectoModel.js` (`getProyectos`) y `reportDiarioController.js` (`calcularCupoDiasHabiles`):**
   - La subconsulta `LATERAL` de `cupo.duracion_plan` en `proyectoModel.js` solo evaluaba `GREATEST(duracion_dias, cantidad_dias, cantidad)` sobre `lineas_servicio`. En servicios cotizados con modalidad `"Horas Mes Minimas"` (`cantidad_meses: 1`), `cantidad` y `cantidad_dias` valen `1`, ignorando el rango `fecha_plan_fin - fecha_plan_ini + 1` (`30 días`) y `cantidad_meses * 30`.
2. **Cierre forzado en `regularizarReporteManual` (`reportDiarioController.js`):**
   - Cuando el analista ingresaba manualmente solo el inicio de jornada sin `horometro_termino` ni respaldo físico, el controlador forzaba `const hFin = hora_termino || '18:00'` e insertaba el registro como `estado_reporte = 'REGULARIZADO_MANUAL'` y `estado_jornada = 'CONCLUIDO'`. Al contabilizarse `reports_cerrados = 1 >= duracion_plan (1)`, `getProyectos` promovía el proyecto de Estado `5` a Estado `6` (Terminado).
3. **Inyección incondicional de `Flete Solo Retorno` en `itsController.js` (`getITS`):**
   - Siempre que `valorFletePactado > 0`, `getITS` inyectaba automáticamente tanto `Flete Solo Ida` (`FLE-IDA`) como `Flete Solo Retorno` (`FLE-RET`) sin verificar en `tequ_log_desplazamiento` si realmente existía un viaje de retorno ejecutado.

---

## 5. Plan de Mitigación y Resolución
1. **Backend (`proyectoModel.js`):**
   - Se amplió `cupo.duracion_plan` en `getProyectos` para incluir `cantidad_meses * 30`, la diferencia de fechas por línea (`fecha_plan_fin - fecha_plan_ini + 1`) y la diferencia de fechas del proyecto (`crm_v1.fecha_hora_termino - crm_v1.fecha_hora_inicio + 1`).
   - Se restringió `reports_cerrados` a registros con `fecha_termino_servicio IS NOT NULL` y `estado_jornada != 'JORNADA_EN_CURSO'`.
2. **Backend (`reportDiarioController.js`):**
   - En `calcularCupoDiasHabiles`, se incorporó el cálculo por rango de fechas y `cantidad_meses * 30`, además de proteger `horas_minimas` diarias frente a pisos mensuales (`unidad` con `MES`).
   - En `regularizarReporteManual`, cuando se ingresa únicamente el inicio de jornada (sin `horometro_termino` ni documento adjunto), el registro se guarda como `estado_reporte = 'JORNADA_EN_CURSO'` y `estado_jornada = 'JORNADA_EN_CURSO'` con `fecha_termino_servicio = NULL`.
3. **Backend (`itsController.js`):**
   - En `getITS`, `Flete Solo Retorno` (`FLE-RET`) solo se incorpora cuando existe un viaje de retorno real en `tequ_log_desplazamiento` (`tipo_trayecto IN ('RETORNO', 'IDA_Y_VUELTA')` o tiempos de salida de faena / llegada a patio).
4. **Normalización de Datos en `sch_leangsp_prod` (`id_proyecto = 27`):**
   - `tpry_proyecto`: `id_proyecto_estado = 5`, `duracion_plan = 30`.
   - `tedp_reporte_avance` (`id_reporte_avance = 2`): normalizado a `estado_reporte = 'JORNADA_EN_CURSO'`, `estado_jornada = 'JORNADA_EN_CURSO'`, `fecha_termino_servicio = NULL`, `horometro_inicio = 14040.00`, `odometro_inicio = 70789.00`, `horas_operadas = 0`, `horas_facturables = 0`, `horas_minimas = 8.00`.
   - `tequ_log_desplazamiento`: eliminados los 2 registros vacíos duplicados (`id_log_desplazamiento IN (1, 2)`), conservando el viaje real `id_log_desplazamiento = 3` (`ARRIBADO`).

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- La OT **`GSP-2611-1830-001` (Constructora Inarco)** ya se encuentra nuevamente **En Ejecución (Columna 5)** con su cupo real de **30 días**.
- El Report del **Día 1 (`2026-11-02`)** quedó normalizado como **Jornada en Curso** (iniciada a las `08:00` con horómetro `14040` y odómetro `70789`), listo para que al finalizar la jornada el operador o Control de Gestión registre la hora y horómetro de término.
- En el **ITS**, únicamente figura el **Flete Solo Ida** (`$750.000`); el **Flete Solo Retorno** solo aparecerá cuando se ejecute el retorno real del equipo a planta.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Todo cálculo de duración de OT debe contemplar unidades mensuales (`cantidad_meses * 30`) y rangos de fechas contractuales (`fecha_plan_ini` a `fecha_plan_fin`).
- La carga manual de reports desde Torre de Control distingue explícitamente entre una apertura de inicio de jornada (`JORNADA_EN_CURSO`) y un reporte concluido con término real.
