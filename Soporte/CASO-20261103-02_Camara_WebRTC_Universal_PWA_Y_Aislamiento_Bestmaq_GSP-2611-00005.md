# Ficha de Incidente de Soporte Operacional — CASO-20261103-02

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261103-02`
- **Fecha / Hora:** 2026-11-03 11:45 CLT
- **Operador / Usuario Afectado:** Claudio Gallardo (`id_user = 62`, `claudiogallardo1984@gmail.com`) y operadores en terreno utilizando dispositivos Android.
- **Negocio / OT:** `GSP-2611-00005` (`id_proyecto = 34`, Besalco — Mall Parque Costanera) y toda la aplicación móvil PWA.
- **Equipo Involucrado:** Camión Plataforma `DRCX. 62- 6` (`id_equipo = 75`, `FREIGHTLINER M2 106`) y Grúa Horquilla `KKFG-50- 6` (`id_equipo = 58`, `HYUNDAI 30 DT-7`).
- **Ambiente:** Producción (`PROD`) y Desarrollo (`DEV`) — `PWA v1.0.61`.
- **Severidad:** Crítica (recarga/cierre de pestaña en Android al tomar fotografías en Report Diario / Checklists y exposición cruzada de módulo Bestmaq Plataformas 360° en servicios GSP).

---

## 2. Síntoma Reportado por Terreno
1. **Reinicio de PWA al usar cámara en Report Diario y otros formularios:**
   > *"El report pasa lo mismo, debes resolver el problema de la camara en todos lados."*
   En teléfonos Android, al pulsar captura fotográfica en el Report Diario de Izaje (`ReportDiarioIzaje.vue`) o en checklists (`FotoCapture.vue`, `FotoCheck.vue`, `surveys.vue`), el atributo `<input type="file" capture="environment">` invocaba la aplicación nativa de cámara externa del teléfono, provocando que el sistema operativo Android matara el proceso en segundo plano de Chrome/PWA por presión de memoria RAM y recargara la página desde cero al volver de la foto.
2. **Aparición indebida de tarjeta Bestmaq (BSM) Plataformas 360° en el teléfono de Claudio Gallardo (`GSP-2611-00005`):**
   > *"Y en caso 0005 Besalco, Claudio. No tiene nada que ver con plataformas."* / *"A claudio no le debería salir nada de Bestmac"*
   En la pantalla principal de `Operación` (`/surveys`), a Claudio Gallardo (`claudiogallardo1984@gmail.com`) le aparecía el bloque `BESTMAQ (BSM) • ROYAL RENTAL • ARRIENDO SIN OPERADOR — Acta de Entrega y Retiro de Plataformas 360°` mostrando `Plataforma: KKFG-50- 6 (HYUNDAI 30 DT-7)` y `Viaje Camión KKFG-50- 6: ASIGNADO`.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
Consultando el proyecto `id_proyecto = 34` (`GSP-2611-00005`) en `sch_leangsp_prod.tpry_proyecto` y sus viajes en `sch_leangsp_prod.tequ_log_desplazamiento`:
- El negocio `GSP-2611-00005` es un servicio de **Grúas San Pablo (`GSP-`)** para Besalco con dos equipos asignados:
  - Línea 1: `id_equipo = 58` (`KKFG-50- 6`, `HYUNDAI 30 DT-7`, `GRUA HORQUILLA`), asignado a `id_user = 93` (viaje `id_log_desplazamiento = 9`, estado `ASIGNADO`).
  - Línea 2: `id_equipo = 75` (`DRCX. 62- 6`, `FREIGHTLINER M2 106`, `CAMION PLATAFORMA`), asignado a Claudio Gallardo (`id_user = 62`, viaje `id_log_desplazamiento = 10`, estado `ARRIBADO`).

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)
1. **Falso positivo de `"CAMION PLATAFORMA"` como Plataforma Elevadora BSM (`surveys.vue`):**
   - La propiedad computada `tienePlataformaAsignada` y las funciones `cargarDatosRealesPlataformaBsm` / `hidratarCabeceraDesdeProyecto` en `ejecucion/pwa/src/views/surveys.vue` evaluaban `txt.includes('PLATAFORMA')`.
   - Al existir un `"CAMION PLATAFORMA"` (`DRCX. 62- 6`) en la OT `GSP-2611-00005`, la condición coincidía erróneamente con la subcadena `"PLATAFORMA"`.
   - Posteriormente, `hidratarCabeceraDesdeProyecto` hacía fallback a `lineas[0]` (`KKFG-50- 6 HYUNDAI 30 DT-7`, Grúa Horquilla) y `cargarViajeDeProyectoBsm(34)` consultaba `/viajes/proyecto/34` sin filtrar por `id_user_chofer === uid`, tomando el viaje `id = 9` (`KKFG-50- 6`, `ASIGNADO`) de otro conductor (`id_user = 93`).
2. **Invocación de Cámara Nativa Externa Android (`capture="environment"`):**
   - Los inputs `<input type="file" accept="image/*" capture="environment">` en `ReportDiarioIzaje.vue`, `surveys.vue`, `FotoCapture.vue`, `FotoCheck.vue`, `MatrizCheck.vue`, `CheckListCamioneta*.vue` y `TallerOtDetalleView.vue` forzaban a Android a abrir la cámara pesada del sistema fuera del navegador.

---

## 5. Plan de Mitigación y Resolución
1. **Módulo Universal de Cámara WebRTC In-App (`ejecucion/pwa/src/utils/inAppCamera.js`):**
   - Se creó `abrirCamaraWebRTC({ titulo, maxDimension, quality })`, que monta un visor de cámara WebRTC (`navigator.mediaDevices.getUserMedia`) en pantalla completa dentro del mismo DOM de la PWA, captura el fotograma en `<canvas>`, lo comprime en JPEG y entrega un botón secundario `"🖼️ Adjuntar Imagen desde Galería / Archivos"` sin atributo `capture`.
   - Se registró `instalarInterceptorGlobalCamaraInApp()` en `main.js` para interceptar en fase de captura y en `HTMLInputElement.prototype.click` cualquier `<input type="file" capture="...">` remanente en toda la PWA.
   - Se conectaron directamente `ReportDiarioIzaje.vue`, `surveys.vue`, `FotoCapture.vue` y `FotoCheck.vue` a `abrirCamaraWebRTC()`.
   - Se añadió persistencia automática en tiempo real en `localStorage` del borrador del formulario en `ReportDiarioIzaje.vue`.
2. **Aislamiento Estricto del Módulo Bestmaq Plataformas 360° (`ejecucion/pwa/src/views/surveys.vue`):**
   - Se implementaron los predicados `esTextoPlataformaElevadora(txtRaw)` (que excluye explícitamente `CAMION PLATAFORMA`, `CAMA BAJA`, `HORQUILLA`, `CAMION PLUMA`, `GRUA MOVIL`, `TRACTO`) y `esProyectoPlataformaBsm(p)` (que excluye explícitamente cualquier código `GSP-*`).
   - Se filtró `cargarViajeDeProyectoBsm` exclusivamente por `Number(v.id_user_chofer) === uid` y se impidió que sobrescriba `viajeActivo.value`.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- **Para Claudio Gallardo y operadores en terreno:**
  1. Al actualizar o recargar la PWA (`v1.0.61`), desaparece por completo la tarjeta de **Bestmaq (BSM) — Acta de Entrega y Retiro de Plataformas 360°** en las órdenes de Grúas San Pablo (`GSP-2611-00005`).
  2. Al tomar fotos de horómetro en el **Report Diario de Izaje** o evidencias en **Checklists**, se abre la cámara integrada dentro de la misma pantalla de la aplicación sin salir de Chrome ni reiniciar el formulario.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Nunca usar coincidencia parcial `.includes('PLATAFORMA')` para distinguir plataformas de elevación (Manlift / Alzahombre / Tijera) de camiones de transporte (`CAMION PLATAFORMA`).
- Nunca usar `<input type="file" capture="environment">` directo en Android PWA; toda captura fotográfica debe ejecutarse dentro del navegador mediante `getUserMedia` + `<canvas>` (`abrirCamaraWebRTC`).
