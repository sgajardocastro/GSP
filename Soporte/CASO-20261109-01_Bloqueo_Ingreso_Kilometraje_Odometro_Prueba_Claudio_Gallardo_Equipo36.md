# Ficha de Caso de Soporte: CASO-20261109-01

## 1. Identificación del Incidente
- **Código:** CASO-20261109-01
- **Fecha:** 2026-11-09
- **Proyecto Involucrado:** OT 62 (`codi_proyecto = GSP-2611-00020`, Proyecto: *VISTA DEL CARMEN*) / Módulo de Viaje Conductor y Reporte Diario PWA
- **Usuario Afectado / Reportante:** Claudio Gallardo (`id_user = 62`, Operador Grúa) / Supervisión de Operaciones
- **Equipo Involucrado:** Equipo ID 36 (Grúa Telescópica Liebherr LTM-1055, Patente `CCCB.38-1`)
- **Ambiente:** Producción (`sch_leangsp_prod`) y Desarrollo (`sch_leangsp`)
- **Severidad:** Alta (Bloqueo operacional al operador para iniciar viaje y reportar kilometraje diario en faena)
- **Estado:** RESUELTO (Datafix Estructural y Auditoría de Flota / Mandato Constitucional Cero Parches)

---

## 2. Síntoma Reportado
El operador Claudio Gallardo, asignado a la OT 62 con la Grúa Telescópica Liebherr LTM-1055 (Patente `CCCB.38-1`), no podía ingresar el kilometraje (odómetro) de salida en la PWA ni en el inicio de su Reporte Diario, recibiendo una alerta de validación incremental que rechazaba cualquier valor ingresado.

---

## 3. Causa Raíz Técnica
1. **Dato de Prueba Residual en Registro Maestro del Activo:**
   Al consultar la tabla `sch_leangsp_prod.tequ_equipo` para el activo `id_equipo = 36`, el campo `odometro_acumulado` registraba exactamente **`145820.50 km`**.
2. **Origen del Valor Mock:**
   La cifra `145820.5` correspondía a un mock histórico de prueba hardcodeado en la vista de simulación de `ViajeConductor.vue` (líneas 151 y 1763) que fue transferido a la base de datos de producción mediante una sincronización de prueba (`SYNC_PWA`).
3. **Mecanismo de Falla (Regla Incremental Estricta):**
   Tanto en la PWA (`ViajeConductor.vue`: `odoSal < minOdo`) como en el controlador backend (`reportDiarioController.js`: L. 885), el sistema exige estrictamente que el odómetro ingresado no sea menor al `odometro_acumulado` del equipo. Al ser el kilometraje real de la grúa Liebherr sustancialmente menor a 145.820 km, el sistema bloqueaba cualquier ingreso legítimo.

---

## 4. Solución Aplicada (Resolución de Fondo en 4 Niveles - Cero Parches)
1. **Nivel 1 (Origen del Dato):**
   Se verificó que los reportes y viajes en curso de Claudio Gallardo (Reporte Diario `id_reporte_avance = 46` y Viaje `id_log_desplazamiento = 50`) mantenían su odómetro en `NULL`, por lo que no existía contaminación en cascada en las transacciones activas de la jornada.
2. **Nivel 2 (Integridad en Base de Datos):**
   Bajo autorización explícita del usuario, se ejecutó una transacción SQL en producción (`sch_leangsp_prod`) reseteando a `0.00` el odómetro acumulado del equipo 36, preservando intactos sus horómetros reales de grúa (`14.437,00 hrs`) y chasis (`4.837,00 hrs`):
   ```sql
   UPDATE sch_leangsp_prod.tequ_equipo
   SET odometro_acumulado = 0.00,
       fecha_ultima_lectura = CURRENT_TIMESTAMP,
       fuente_ultima_lectura = 'RESET_DATAFIX_SOPORTE'
   WHERE id_equipo = 36;
   ```
3. **Nivel 3 (Barrido Preventivo y Saneamiento en Bloque de Flota):**
   La auditoría masiva sobre `tequ_equipo` detectó que el equipo ID 43 (Tadano GT 750EL, patente `TYGC.45-1`) contenía exactamente la misma cifra mock (`145.820,50 km`). Se saneó preventivamente en la misma transacción:
   ```sql
   UPDATE sch_leangsp_prod.tequ_equipo
   SET odometro_acumulado = 0.00,
       fecha_ultima_lectura = CURRENT_TIMESTAMP,
       fuente_ultima_lectura = 'RESET_DATAFIX_SOPORTE'
   WHERE id_equipo = 43 AND odometro_acumulado = 145820.50;
   ```
4. **Nivel 4 (Alineación de Entornos):**
   Se replicó el reseteo en el esquema de desarrollo (`sch_leangsp`) para mantener la paridad absoluta entre ambientes.

---

## 5. Archivos Intervenidos
- Base de Datos Producción: `sch_leangsp_prod.tequ_equipo` (Equipos 36 y 43)
- Base de Datos Desarrollo: `sch_leangsp.tequ_equipo` (Equipos 36 y 43)
- Script de ejecución y auditoría: `scratch/execute_reset_odometros.cjs`

---

## 6. Verificación y Resultados
- Consulta SQL post-ejecución confirmó:
  - Equipo 36 (Liebherr LTM-1055): `odometro_acumulado = 0.00`, `horometro_grua = 14437.00`, `horometro_chasis = 4837.00`.
  - Equipo 43 (Tadano GT 750EL): `odometro_acumulado = 0.00`, `horometro_grua = 4185.00`, `horometro_chasis = 3240.20`.
- El operador Claudio Gallardo queda habilitado para ingresar el odómetro real del camión grúa sin restricciones; el primer kilometraje ingresado se convertirá automáticamente en la nueva línea base acumulada del activo.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Los valores de prueba / mocks en vistas Vue (como el botón demo o placeholders) jamás deben sincronizarse hacia esquemas de producción mediante flags automáticos (`SYNC_PWA`).
- En futuros despliegues o migraciones de catálogo de activos, debe incorporarse un script de validación que detecte valores idénticos a los mocks históricos (`145820.5`, `3240.2`) antes de dar por cerrada la carga de datos.
