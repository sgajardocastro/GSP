# Ficha de Caso de Soporte: CASO-20261105-01

## 1. Identificación del Incidente
- **Código:** CASO-20261105-01
- **Fecha:** 2026-11-05
- **Proyecto Involucrado:** `RYL-2611-00001` (`id_proyecto = 48`, Obra Salfa Recabarren)
- **Usuario Afectado / Reportante:** Isis Osses (Chofer / Operador Cama Baja)
- **Equipo Involucrado:** Camión `DRCX. 62- 6` (ID 75) traslada Plataforma `PAD-31` (XCMG XGA16E)
- **Ambiente:** Producción (`PROD`)
- **Severidad:** Crítica (Bloqueo en entrega física y firma de acta con cliente en obra)
- **Estado:** RESUELTO

---

## 2. Síntoma Reportado por Terreno
El chofer traslada la plataforma de arriendo a faena Salfa. Al llegar para entregarla, la PWA le muestra un candado operativo en la tarjeta de Acta de Entrega y Retiro de Plataformas 360°, indicando:
> *"🔒 Candado Operativo: Debe registrar primero la llegada del camión en la Hoja de Ruta superior (Salida de Base y Llegada a Obra) antes de abrir el Acta de Entrega 360°."*
El botón `1. Acta Entrega 360°` se encontraba deshabilitado.

---

## 3. Causa Raíz Técnica
1. **Acoplamiento Artificial entre Viaje y Acta:**
   En `Surveys.vue`, la variable computada `viajeIdaPlataformaCompletado` exigía obligatoriamente que el registro de desplazamiento en `tequ_log_desplazamiento` estuviese en estado `ARRIBADO` o contase con `fecha_llegada_faena`.
2. **Omisión Operativa en Terreno:**
   El operador inició el viaje en base GSP, pero al llegar a obra no completó el formulario modal de llegada en la Hoja de Ruta (que solicita odómetro, fotos y PIN), por lo que el viaje se mantuvo en estado `EN_RUTA`.
3. **Bloqueo Injustificado de Documento Crítico:**
   El Acta de Entrega 360° es el documento legal y comercial frente al cliente y no debe quedar subordinada al estado de la telemetría del viaje de traslado.

---

## 4. Solución Aplicada
1. **Desacoplamiento Total en PWA (`Surveys.vue`):**
   - Se modificó `viajeIdaPlataformaCompletado` para que retorne `true` de manera incondicional.
   - Se removió la restricción `:disabled` del botón `1. Acta Entrega 360° ➔`.
   - Se eliminó el bloqueo visual de opacidad y `pointer-events: none` dentro del modal de Entrega.
2. **Incremento de Versión:**
   - `package.json` de la PWA actualizado a versión `1.0.64`.
3. **Compilación y Despliegue:**
   - `npm run build` ejecutado exitosamente.
   - Los 134 archivos resultantes fueron transferidos vía SFTP al directorio `/var/www/html/pwa-gsp-prod/`.

---

## 5. Archivos Intervenidos
- `ejecucion/pwa/src/views/Surveys.vue`
- `ejecucion/pwa/package.json`
- Directorio en servidor: `/var/www/html/pwa-gsp-prod/`

---

## 6. Verificación y Resultados
- Los archivos en el servidor remoto `/var/www/html/pwa-gsp-prod` fueron actualizados.
- La PWA permite abrir y firmar el Acta de Entrega 360° sin importar si el viaje de ida se encuentra en `ASIGNADO`, `EN_RUTA` o `ARRIBADO`.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Los flujos de firma con clientes en terreno deben operar con desacoplamiento determinista respecto a la telemetría de viajes para evitar bloqueos por factores de red, omisiones de choferes o fallas de GPS.
