# 🛠️ CASO-20261021-01: Error SQL «no existe la columna horometro_final» al Iniciar Jornada Multi-Día (Día 7 en OT-16)

---

## 1. Ficha del Incidente

| Parámetro | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261021-01` |
| **Fecha / Hora** | 2026-10-21 11:08 CLT (Hora Oficial de Chile) |
| **Operador / Usuario Afectado** | Robert Rodríguez (`id_user = 49`, RUT `26.588.627-5`) |
| **Negocio / OT** | `GSP-2610-233-016` (`id_proyecto = 16`, servicio de 10 días) |
| **Cliente / Faena** | Sociedad de Constructores Tensacon S.A. / Faena Planta Ferrero |
| **Equipo Involucrado** | Grúa Móvil Liebherr LTM-1040 (`DZXL.21-0`, `id_equipo = 33`) |
| **Ambiente** | Producción (`PROD` - Base de datos `sch_leangsp_prod`, PWA `v1.0.53`) |
| **Severidad** | **Crítica** (Bloqueo al guardar Inicio de Jornada en días `> 1`) |
| **Estado** | **RESUELTO Y CERTIFICADO CON SIMULACIÓN REAL EN PRODUCCIÓN** |

---

## 2. Síntoma Reportado por Terreno

Mediante audio de WhatsApp (`WhatsApp Ptt 2026-10-21 at 11.08.30.ogg`), el operador Robert Rodríguez reportó:
> *"No, solamente que el procedimiento de ingreso de los datos para inicio de faena, al final me aparece que no... no existe columna final de datos anteriores, o no sé si es que le falta algo ingresarle al programa para que pueda iniciar la jornada, por eso le preguntaba que me orientara un poquito, a lo mejor yo estoy omitiendo algún paso del procedimiento, por favor."*

---

## 3. Diagnóstico Técnico & Causa Raíz

1. **Columna SQL inexistente en `guardarInicioJornada` (`reportDiarioController.js`, líneas 527–538):**
   En la validación de secuencia cronológica multi-día (`if (Number(dia_correlativo) > 1)`), la consulta `prevSql` ejecutaba:
   ```sql
   SELECT id_reporte_avance, estado_reporte, estado_jornada, horometro_final, horometro_grua_termino
   FROM tedp_reporte_avance
   ```
   En `tedp_reporte_avance`, la columna real se denomina `horometro_termino` (no `horometro_final` ni `horometro_grua_termino`). Al ejecutarse con `dia_correlativo = 7`, PostgreSQL arrojó `error: no existe la columna «horometro_final»` (`42703`), que el frontend mostró en el toast de error.

2. **¿Por qué se manifestó por primera vez el 21-10-2026?**
   Entre el 15-oct y el 20-oct, por la desalineación previa del equipo del viaje (`45`) frente a la grúa (`33`), el contexto sugería `dia_correlativo = 1` y nunca entraba al bloque `if (Number(dia_correlativo) > 1)`. Una vez resuelto el equipo canónico `33` (`REQ-1060`), el sistema detectó los 6 reportes cerrados y sugirió `dia_correlativo = 7`, activando la consulta defectuosa.

3. **Desorden histórico de `dia_correlativo` en la OT 16:**
   Los reportes `23` (`15-oct`), `26` (`16-oct`), `27` (`19-oct`) y `22` (`20-oct`) habían quedado grabados con `dia_correlativo = 1` repetido.

---

## 4. Plan de Mitigación y Resolución Aplicada

1. **Backend (`ejecucion/backend_remoto/src/controllers/reportDiarioController.js`):**
   - Sustitución de `horometro_final, horometro_grua_termino` por `horometro_termino` en `prevSql`.
   - Evaluación de secuencia multi-día considerando el total real de reportes cerrados del equipo (`Math.max(maxDiaCerradoEq, cerradosEquipo.length)`).
2. **Regularización en Base de Datos (`sch_leangsp_prod.tedp_reporte_avance`):**
   ```sql
   UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 3 WHERE id_reporte_avance = 23 AND id_proyecto = 16;
   UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 4 WHERE id_reporte_avance = 26 AND id_proyecto = 16;
   UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 5 WHERE id_reporte_avance = 27 AND id_proyecto = 16;
   UPDATE sch_leangsp_prod.tedp_reporte_avance SET dia_correlativo = 6 WHERE id_reporte_avance = 22 AND id_proyecto = 16;
   ```
3. **Verificación Empírica E2E en Producción (`id_user = 49`):**
   Simulación real de `GET /reports/usuario/pendientes`, `GET /operaciones/report/contexto/16`, `POST /operaciones/report/inicio-jornada` (`dia_correlativo = 7` ➔ `200 OK`), reingreso en la tarde (`faseVisual = 2`) y rollback limpio (`setval = 27`).
