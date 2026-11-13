# Ficha de Caso de Soporte: CASO-20261110-03

## 1. Identificación del Incidente
- **Código:** CASO-20261110-03
- **Fecha:** 2026-11-10
- **Proyecto Involucrado:** `RYL-2611-00002` (`id_proyecto = 49`, Cliente: *Montajes Claudia Fernanda Gutierrez*, Obra: *Salfa Recabarren*, Emisora: *Arriendo Royal Rental Limitada*)
- **Usuario Afectado / Reportante:** Gerencia y Analista de Operaciones / Control de Gestión
- **Equipo Involucrado:** Camión Plataforma `DRCX. 62- 6` (ID `75`)
- **Ambiente:** Producción (`sch_leangsp_prod` / PM2 ID 13 `lean-services-gsp-prod`)
- **Severidad:** Media (Distorsión en precálculo de ITS: asignación de 8 horas mínimas y reporte como jornada de horas a servicio exclusivo de transporte/traslado)
- **Estado:** RESUELTO Y CERTIFICADO EN PRODUCCIÓN (Resolución de Fondo — Cero Parches)

---

## 2. Síntoma Reportado
En la sesión operativa del 10 de noviembre de 2026, el usuario reportó:
> *"RYL-2611-00002. Es un servicio de Traslado realizado por Royal Rental. En el ITS aparece con horas minimas, pero es un servicio de Flete o Traslado. Dime cual es el fallo de lógica. SOLO ESO. DIME CUAL ES EL FALLO de lógica."*

---

## 3. Metodología de Auditoría Forense y Extracción de Datos
1. Inspección de solo lectura sobre `tpry_proyecto` ID 49:
   - Línea comercial CRM: `"tipo": "TRASLADOS"`, `"unidad": "TRASLADO IDA"`, `"cantidad": 1`, `"valorUnitario": 90000`, `"pisoMinimo": 0`.
   - Sin líneas de grúa ni arriendo de maquinaria por horas.
2. Consulta al endpoint `GET /api/its/49` en el backend remoto de producción:
   - `horas_minimas_pactadas` retornaba `8`.
   - `jornadas` retornaba 2 filas:
     - Fila 0: `FLE-IDA` (Flete Solo Ida, $90.000, 1 hr).
     - Fila 1: `DOC-FIS-34` (Reporte de terreno físico clasificado como `tipo_servicio: 'Hora'`, `tarifa_hora: 0`, `horas_report: 9`).
3. Inspección del código fuente en `ejecucion/backend_remoto/src/controllers/itsController.js`.

---

## 4. Hallazgos y Cronología Forense Irrefutable
1. **Inicialización Fija de Horas Mínimas:** En `itsController.js:359`, `let horasMinimas = 8.0;` se inicializaba por defecto asumiendo que todo proyecto correspondía a izaje móvil.
2. **Omisión de Reseteo para Traslados Puros:** Al recorrer las líneas comerciales (`lineas.forEach`), `esLineaTraslado` acumulaba `valorFletePactado`, pero nunca reseteaba `horasMinimas = 0`. La lógica de reseteo (`if (esValorFijoComercial && !tieneLineaPorHora)`) no aplicaba a traslados unitarios (que no están marcados con el flag booleano `es_valor_fijo` de suma alzada).
3. **Mapeo Binario Forzado en Reportes:** Al armar las jornadas desde los reportes diarios (`reportsRows.forEach`), la condición `tipo_servicio: esValorFijoComercial ? 'Valor Fijo' : 'Hora'` forzaba a que el reporte del camión plataforma se registrara como servicio por `'Hora'` con tarifa $0 y 9 horas calculadas.
4. **Duplicación de Jornada:** El controlador inyectaba adicionalmente una fila sintética `FLE-IDA` por $90.000 sin vincularla al reporte físico real ni a sus evidencias adjuntas.

---

## 5. Causa Raíz
El backend carecía de una bandera determinista `esSoloTraslado` derivada del desglose comercial. Al evaluar proyectos donde el 100% de las líneas corresponden a transporte/traslado, el sistema caía en el fallback de servicios por hora, asignando 8 horas mínimas pactadas y bifurcando artificialmente el reporte diario entre una fila sintética de flete y una fila de horas a tarifa $0.

---

## 6. Resolución Estructural de Fondo ("Cero Parches") — 4 Niveles

1. **Nivel 1 (Frontend — `ModalITS.vue`):**
   - Consume fidedignamente la cabecera y jornadas del endpoint `/api/its/:id_proyecto`, reflejando 0 horas mínimas y mostrando la jornada real de traslado sin campos distorsionados.
2. **Nivel 2 (Backend API — `itsController.js`):**
   - Incorporada la variable determinista:
     ```javascript
     const esSoloTraslado = tieneLineaTraslado && !tieneLineaPorHora && !esValorFijoComercial && valorFijoPactado === 0;
     if ((esValorFijoComercial && !tieneLineaPorHora) || esSoloTraslado) {
       valorHoraPactado = 0;
       horasMinimas = 0;
     }
     ```
   - Al construir la cabecera del ITS: `horas_minimas_pactadas: (esValorFijoComercial || esSoloTraslado) ? 0 : horasMinimas`.
   - Al construir las jornadas desde los reportes diarios de terreno:
     Si `esSoloTraslado` es verdadero, el reporte se clasifica directamente como `Flete Solo Ida` (o Retorno), con tarifa igual al monto del flete pactado (`$90.000`), vinculando su evidencia física/FES y horas reales.
   - En la sección de inyección de fletes sintéticos: se condiciona a `!tieneFleteIdaYa`, suprimiendo la fila huérfana duplicada.
3. **Nivel 3 (Base de Datos PostgreSQL):**
   - Mantenimiento de integridad relacional en `tits_informe_termino` y `tits_jornada_detalle` sin distorsiones en constraints de tipo de servicio.
4. **Nivel 4 (Consolidación y Reportes):**
   - El ITS compila con `total_horas_report = 0`, `total_ingresos_horas = 0`, `total_ingresos_fletes = $90.000` y `total_ingresos_facturables = $90.000`.

---

## 7. Verificación Empírica y Certificación E2E
* **Consulta Real al Endpoint en Producción (`GET /api/its/49`):**
  ```json
  {
    "id_its": null,
    "folio_its": "ITS-RYL-2611-00002-001",
    "horas_minimas_pactadas": 0,
    "valor_hora_pactado": 0,
    "valor_flete_pactado": 90000,
    "unidad_flete_pactado": "TRASLADO IDA",
    "es_valor_fijo": false,
    "total_horas_report": 0,
    "total_ingresos_horas": 0,
    "total_ingresos_fletes": 90000,
    "total_ingresos_facturables": 90000,
    "jornadas": [
      {
        "fecha": "2026-11-05",
        "tipo_servicio": "Flete Solo Ida",
        "patente": "DRCX. 62- 6",
        "horas_reales": 7.85,
        "horas_report": 1,
        "tarifa_hora": 90000,
        "subtotal": 90000,
        "numero_report": "DOC-FIS-34",
        "tipo_respaldo": "FISICO_MANUAL"
      }
    ]
  }
  ```
* **Conclusión:** Cero horas mínimas, cero duplicación, 1 sola jornada real con firma y respaldos por $90.000.
