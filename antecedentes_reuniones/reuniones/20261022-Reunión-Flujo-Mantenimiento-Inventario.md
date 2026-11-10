# 📝 Minuta de Reunión: Revisión Flujo Mantenimiento-Inventario — Demostración Operacional, Segregación de Funciones (SoD), Métricas Cuantitativas y Plan de Corte

**Fecha:** 2026-10-22  
**Hora:** 10:00 - 11:00 CLT  
**Participantes:**  
*   **Leonel Vergara** (Jefe de Taller - Grúas San Pablo - `mantencion@arriendosanpablo.cl`)  
*   **Eduardo Aguirre** (Encargado Adquisiciones e Inventario Pañol Temuco - Grúas San Pablo - `adquisiciones@arriendosanpablo.cl`)  
*   **Jorge Ponce** (Gerente General / Operaciones - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Alan Sarpi** (Operaciones / Mantenimiento - Grúas San Pablo)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  

**Enlaces y Registros Oficiales:**  
*   [Evento de Calendario Google Meet](https://calendar.google.com/calendar/event?eid=NGphcGFxbGw4ZmQ2aDM4dnNkdG01dHNldHMgc2dhamFyZG9jQG0)  
*   [Transcripción Oficial de la Reunión](https://docs.google.com/document/d/14tIkQTrQBDf3xmBJY84zv4rZ5-dQZ2_yGwZps1sDvVI/edit?usp=drive_web&tab=t.au2q3n5drbuo)  
*   [Presentación Web Interactiva de la Reunión](https://servidor.leanglobal.cl/pptas/GSP/reuniones/presentacion_flujo_taller_y_bodega.html)  

---

## 🎯 1. Resumen Ejecutivo

Sesión de revisión y alineación operacional del ciclo completo de **Mantenimiento de Flota e Inventario WMS-Lite**, con la participación directa del equipo de Taller (**Leonel Vergara**), Pañol/Adquisiciones (**Eduardo Aguirre**) y Gerencia/Operaciones (**Jorge Ponce**, **Alan Sarpi**, **Sergio Gajardo**).

El objetivo estratégico acordado es iniciar la **operación exclusiva en la plataforma LeanGlobal en un plazo perentorio de 2 a 3 días** (lunes y martes de pruebas operacionales en faena, corte definitivo a partir del miércoles), abandonando el software legado anterior para eliminar de raíz el retrabajo derivado de la duplicidad en órdenes de trabajo y gestión de pañol.

Durante la demostración en vivo de creación y ejecución de una Orden de Trabajo (OT) sobre equipos de flota, se evaluó la cadena integrada de 6 fases, se resolvieron incidencias de interacción (control anti-duplicación por clics múltiples, segregación estricta de funciones entre la requisición de Taller y el despacho físico de Pañol con Kardex), se revisó la visualización de existencias y se acordaron mejoras ergonómicas como la multiselección de mecánicos y la impresión física de la pauta de actividades para anotaciones en taller. Asimismo, se debatió sobre la gestión cuantitativa de tiempos de inactividad por repuestos en importación y la medición de disponibilidad de flota bajo metodología Lean.

---

## 📅 2. Plan y Cronograma de Transición Definitiva (Corte a LeanGlobal)

1. **Objetivo de Corte:**  
   Eliminar el uso paralelo de sistemas para evitar sobrecarga y descuadres de existencias. La operación debe migrar al 100% al nuevo software.
2. **Ventana de Pruebas Operacionales (Lunes y Martes):**  
   * Se procesarán OTs preventivas y correctivas reales (tanto rutinarias como de alta complejidad).
   * **Sergio Gajardo** prestará soporte en caliente y en tiempo real para resolver cualquier incidencia inmediata (siguiendo el modelo exitoso de marcha blanca aplicado en faenas de San Pablo, Calama y Antofagasta).
3. **Corte Definitivo (Miércoles):**  
   * Apagado operativo de la plataforma previa para los módulos de mantenimiento e inventario. Toda OT y movimiento de pañol se procesará exclusivamente en LeanGlobal.

---

## 🔄 3. Cadena Operacional de 6 Fases (Mantenimiento ↔ Inventario)

Se repasó y validó la secuencia de punta a punta entre Taller y Pañol:

```
[ Fase 1: Apertura OT ] 
        │ (Selección de equipo, tipo correctivo/preventivo, prioridad y horómetro)
        ▼
[ Fase 2: Imputación de Mano de Obra ] 
        │ (Asignación de 1 o 2 mecánicos, ej. Juan Espinoza, tarifa oficial HH)
        ▼
[ Fase 3: Requisición de Repuestos ] 
        │ (Solicitud de catálogo WMS o Compra Directa/Terreno, ej. acrílico $60k)
        ▼
[ Fase 4: Despacho Físico y Kardex ] 
        │ (Eduardo Aguirre confirma picking en casillero, rebaja stock y emite SALIDA_OT)
        ▼
[ Fase 5: Ejecución y Check en PWA Móvil ] 
        │ (Mecánicos en patio revisan actividades, registran avances y hallazgos)
        ▼
[ Fase 6: Cierre Supervisado con Firma FES ] 
        │ (Validación técnica de horómetro final, balance de costos y PIN electrónico)
```

---

## 🔍 4. Demostración en Vivo, Hallazgos y Soluciones Acordadas

### A. Apertura de OTs y Control Anti-Duplicación
* **Leonel Vergara** compartió pantalla y ejecutó la creación de una nueva OT, definiendo equipo, clasificación correctiva y criticidad interna.
* **Incidencia Detectada:** Por clics rápidos sucesivos sobre el botón de guardado, el sistema generó duplicidad de la OT.
* **Solución Implementada:** **Sergio Gajardo** confirmó la incorporación de un candado de retardo y bloqueo reactivo (`creandoOt = true`, botón deshabilitado con spinner) que impide el doble envío.

### B. Segregación de Funciones (SoD) en Insumos de Bodega WMS vs Compra Directa
* **Incidencia Operacional:** En la versión previa, cuando Taller agregaba un repuesto, este figuraba de inmediato como `ENTREGADO` y con descuento automático en Bodega, impidiendo que **Eduardo Aguirre** ejerciera el control físico del despacho.
* **Solución y Regla de Negocio (SPEC-095):**
  * Taller solicita el insumo ➔ Queda en estado `⏳ SOLICITADO A BODEGA` (stock intacto, $0 de costo imputado).
  * **Eduardo Aguirre** ingresa a **Inventario > Despacho a OT**, presiona `[📦 Despachar]`, selecciona el casillero físico de pañol y confirma la entrega.
  * El sistema rebaja `tinv_stock`, genera el asiento formal inmutable en Kardex (`SALIDA_OT`) y cambia la línea a `📦 ENTREGADO` imputando el PMP vigente a la OT.
  * Para compras locales en faena (ej. plancha de acrílico por $60.000), se mantiene el modo `COMPRA_DIRECTA` sin afectar existencias de almacén.

### C. Visualización de Repuestos, Filtros y Latencia
* Se constató una discrepancia en la versión de escritorio donde ciertos filtros de búsqueda de repuestos experimentaron retardo de renderizado, mientras que en la aplicación PWA móvil (v1.0.054) se visualizaban correctamente.
* Se atribuyó a latencia de red y debounce en el componente web, quedando ajustado para consulta fluida en tiempo real.
* **Eduardo Aguirre** demostró en pantalla el Kardex, validando la cuadratura exacta entre cantidades físicas, costos PMP y saldos remanentes.

### D. Cierre Técnico Supervisado y Servicios Externos
* Se analizó la imputación de servicios externos especializados (ej. certificaciones de grúa con proveedores como Bureau Veritas en Macul, Santiago).
* **Leonel Vergara** demostró el proceso de cierre supervisado de la OT ingresando la firma electrónica (PIN FES), consolidando el balance de mano de obra y repuestos entregados.

---

## 📊 5. Gestión Cuantitativa de Mantenimiento y Métricas (Filosofía LeanGlobal)

Se debatió el modelo de indicadores que regirá la toma de decisiones gerenciales:

1. **Gestión de Órdenes en Espera (Downtime por Importación):**
   * Cómo tipificar OTs detenidas por repuestos de importación sin castigar artificialmente el rendimiento del equipo de mecánicos de taller.
2. **Disponibilidad de Flota vs Eficiencia de Taller:**
   * **Disponibilidad Operacional (%):** Mide la proporción de tiempo que las grúas están listas para operar en faena comercial.
   * **Tiempo Medio de Reparación (MTTR) / Eficiencia de Taller:** Mide el tiempo neto de ejecución una vez que los recursos y repuestos están en pañol.
3. **Gestión Basada en Datos Objetivos:**
   * **Sergio Gajardo** enfatizó el principio Lean de erradicar suposiciones subjetivas, evaluando objetivamente el desempeño coordinado de Operaciones, Adquisiciones (tiempos de compra) y Taller (tiempos de intervención).

---

## 🤝 6. Acuerdos y Próximos Pasos (TODOs)

| Tarea / Entregable | Responsable | Fecha Límite | Estado |
| :--- | :--- | :--- | :--- |
| **Configurar Multiselección de Mecánicos en OT:** Permitir seleccionar más de un técnico en la misma orden de trabajo. | **Sergio Gajardo** | 2026-10-24 | En Curso |
| **Habilitar Impresión de Hoja de Actividades:** Añadir opción para imprimir en papel la pauta de tareas con renglones para anotaciones manuales en taller. | **Sergio Gajardo** | 2026-10-25 | En Curso |
| **Envío de Minuta y Manuales de Usuario:** Despachar a los participantes la minuta oficial y enlaces al Centro de Documentación de Mantenimiento e Inventario. | **Sergio Gajardo** | 2026-10-23 | Completado |
| **Pruebas Operacionales en Vivo (Faena Temuco):** Ejecución de OTs preventivas y correctivas en el nuevo sistema por parte de Taller y Pañol. | **Leonel Vergara** / **Eduardo Aguirre** | 2026-10-26 a 2026-10-27 | Programado |
| **Reunión de Seguimiento de Uso Operacional:** Sesión de revisión de observaciones tras los primeros 2 días de marcha blanca. | **Todos los participantes** | 2026-10-26 16:00 | Confirmado |
| **Corte Definitivo al Nuevo Sistema:** Apagado de sistemas legacy y operación 100% exclusiva en LeanGlobal Platform. | **Jorge Ponce** / **Leonel Vergara** / **Eduardo Aguirre** | 2026-10-28 | Comprometido |

---

## 📅 7. Siguiente Reunión

* **Fecha y Hora:** Lunes 26 de octubre de 2026 a las 16:00 horas CLT.  
* **Foco Principal:** Revisión del comportamiento operacional en terreno durante lunes y martes, resolución de dudas de Taller y Pañol, y confirmación final del corte operativo definitivo del miércoles.
