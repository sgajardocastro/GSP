# 📝 Minuta de Reunión: Seguimiento Operativo, Mantenimiento y Definición de Flujos (GSP)

**Fecha:** 2026-07-27  
**Participantes:**  
*   **Sergio Gajardo** - Consultor Senior & Arquitecto de Software (LeanGlobal)
*   **Jorge Ponce** - Jefe de Operaciones / Representante (Arriendo de Maquinarias San Pablo)
*   **Jesús Acevedo** - Coordinador Operativo / Comercial (Grúas San Pablo)

---

## 🎯 Objetivos de la Reunión
1. Definir la estrategia de desarrollo integral del sistema, priorizando una arquitectura propia y definitiva (sin integraciones temporales a software externo como Laudus).
2. Analizar el módulo actual de mantención de GSP (OTIM), inventarios y estructuración del nuevo módulo de Mantenimiento & WMS-Lite.
3. Consolidar el flujo comercial-operativo: condiciones comerciales (alimentación, hospedaje, traslados), viáticos y prevención de pagos duplicados.
4. Definir la generación de Orden de Trabajo (OT) en PDF, checklists parametrizables por JSON, tablero de control de analista (semáforos) y usabilidad de la PWA móvil.

---

## 💬 Puntos Tratados

### 1. Estrategia de Desarrollo Integral y Hoja de Ruta
* **Decisión de Arquitectura:** Se acordó no gastar recursos ni tiempo en integraciones temporales con software contable externo (ej. Laudus). Se priorizará la solución definitiva integrada en la plataforma LeanGlobal (módulos de inventarios, mantención, facturación DTE y ERP contable simple).
* **Plazos Estimados:** Se proyecta contar con la solución integral operativa en aproximadamente 1.5 meses.

### 2. Evaluación del Sistema Actual (OTIM) y Módulo de Mantenimiento / WMS
* **Diagnóstico Plataforma V2.0 Actual:** La plataforma interna actual de GSP padece de falta de inteligencia para el análisis de datos, captura manual de información y ausencia de alertas automáticas para mantenciones preventivas según horómetros/kilometraje.
* **Control Estricto de Repuestos y Costos:**
  * Las Órdenes de Trabajo de Mantenimiento deben registrar horas planificadas vs. horas reales, repuestos solicitados y servicios externos.
  * El consumo de repuestos e insumos estará amarrado estrictamente a una OT de taller. La salida de bodega se descontará automáticamente al asignarse a la OT amarrada al centro de costo de la **patente del equipo**.
  * Se requiere un control de auditoría estricto (justificación obligatoria para mermas o robos) para prevenir irregularidades detectadas en aceites, filtros y piezas de alto valor (como el incidente reciente de $30M+ por falla en procedimiento de caja de cambios).
* **Gestión de Inventarios (WMS-Lite):**
  * El combustible, EPP e insumos serán tratados como **bodegas** dentro del sistema.
  * Soporte para códigos de barras (compatible con impresoras térmicas Zebra de GSP) y traspasos entre sucursales (Temuco y Valdivia).
  * Definición adecuada de la granularidad del maestro de productos (marca, modelo, especificación técnica).

### 3. Flujo Comercial ➔ Operacional y Buscador de Direcciones
* **Trazabilidad y Diff:** Las modificaciones realizadas por Operaciones a un Requerimiento comercial quedarán auditadas en el historial (sistema de comparación visual / diff) para evaluar el KPI de calidad técnica de las propuestas comerciales.
* **Geolocalización:** Confirmada la integración del buscador de direcciones sobre el mapa dentro del Gestor de Oportunidades para precisar la logística de obra.

### 4. Condiciones Comerciales, Viáticos y Prevención de Duplicidades
* **Condiciones Comerciales:** Jesús y Jorge detallarán el esquema comercial de alimentación (desayuno, almuerzo, cena), alojamiento y traslado (si los provee el Cliente, San Pablo, o N/A).
* **Viáticos:** Se revisó la tabla escalar de viáticos (desde $7.000 por 8 hrs hasta $16.000 por 17 hrs) y los fondos fijos ($150.000 para operadores y $70.000 para riggers).
* **Control Anti-Duplicación:** El sistema bloqueará la asignación o pago de viáticos por sistema si el contrato/cotización indica que la alimentación es provista directamente por el cliente.

### 5. Generación de Orden de Trabajo (OT) y Checklists JSON
* **Emisión de OT en PDF:** La OT adoptará el mismo diseño formal de la cotización, pudiendo ser descargada e invocar un disparo automático por correo electrónico a los involucrados.
* **Checklists Parametrizables:** Los formularios de inspección (salida, recepción, pre-operacional) se construirán mediante plantillas en formato JSON Schema, eliminando la necesidad de programar vistas rígidas individualmente.
* **Flujo Unificado de Inspección de Salida:** Se consolidarán en un único flujo continuo para el personal de terreno los pasos de coordinación, verificación técnica y confirmación de carga de contrapeso.

### 6. Tablero del Analista (Semáforos) y Usabilidad PWA
* **Monitoreo con Semáforo Visual:** El panel del Analista de Operaciones incluirá indicadores (Verde/Amarillo/Rojo). El estado Rojo alertará inmediatamente cuando un servicio no haya iniciado en la hora programada o si falta el reporte del día anterior.
* **Alertas por Retraso en Firmas:** Alertas automáticas para evitar que los operadores abandonen la faena sin la firma digital o física del reporte por parte del cliente.
* **App Móvil (PWA) & Seguridad:** Ajuste de interfaz PWA para pantallas de smartphones estándar (legibilidad), implementación de un periodo de inactividad (*timeout*) para cierre de sesión por ciberseguridad, y evaluación de mecanismos de acceso simplificado para operarios en faena.

---

## 🤝 Acuerdos y Próximos Pasos (Matriz de Compromisos)

| Tarea / Entregable | Responsable | Fecha Límite | Estado |
| :--- | :--- | :--- | :--- |
| **Compartir accesos plataforma V2.0:** Entregar credenciales del sistema actual para análisis funcional. | Jorge Ponce | Inmediato | Pendiente |
| **Definir requerimientos de Bodega & SKU:** Levantar con Omar la estructura de bodegas, repuestos y procesos de mantenimiento. | Jorge Ponce | 2026-07-31 | Pendiente |
| **Enviar Excel de Condiciones Comerciales:** Entregar planilla con desglose de ítems de alimentación, hospedaje y traslado. | Jesús Acevedo | 2026-07-29 | Pendiente |
| **Enviar Excel de Campos del Acuerdo:** Enviar campos faltantes del formato de acuerdo comercial. | Jesús Acevedo | 2026-07-29 | Pendiente |
| **Compartir Tabla de Viáticos:** Enviar matriz de cálculo de viáticos por tramos de horas. | Jorge Ponce | 2026-07-29 | Pendiente |
| **Enviar Ejemplo de OT:** Proveer plantilla/ejemplo de la Orden de Trabajo actual. | Jorge Ponce | 2026-07-29 | Pendiente |
| **Integrar Estructura Comercial en Preventa:** Incorporar campos de condiciones comerciales (pensiones, alimentación, traslados) en la UI de Cotización. | Sergio Gajardo | 2026-07-31 | Pendiente |
| **Generador de OT en PDF & Mailer:** Implementar motor de generación de PDF para la OT y envío por correo. | Sergio Gajardo | 2026-08-03 | Pendiente |
| **Flujo Unificado de Inspección de Salida:** Crear flujo integrado en PWA (coordinación + checklist + contrapeso). | Sergio Gajardo | 2026-08-05 | Pendiente |
| **Finalizar Flujo Operativo PWA:** Completar marcaciones en tiempo real y firmas digitales en la PWA. | Sergio Gajardo | 2026-08-05 | Pendiente |
| **Timeout de Sesión por Inactividad:** Configurar tiempo de expiración de sesión por ciberseguridad. | Sergio Gajardo | 2026-07-31 | Pendiente |
| **Evaluar Login Simplificado:** Analizar usabilidad vs. seguridad para acceso de operadores en faena. | Equipo GSP / LeanGlobal | 2026-08-03 | Pendiente |
