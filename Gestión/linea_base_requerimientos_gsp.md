# 📊 Línea Base de Requerimientos y Trazabilidad - Grúas San Pablo (GSP)

Este documento registra la matriz de requerimientos y el estado de desarrollo para el proyecto de Grúas San Pablo (GSP), agrupado por ámbitos temáticos y vinculando las tareas de preventa e implementación.

---

## 📈 1. Resumen de Avance del Proyecto

| Ámbito Temático (Grupo) | Requerimientos Totales | Completados (Desplegados) | % Avance Promedio | Estado General |
| :--- | :---: | :---: | :---: | :--- |
| **Captura Operacional (PWA)** | 4 | 0 | 0% | `Definición` |
| **Torre de Control (Core)** | 3 | 0 | 0% | `Definición` |
| **Facturación & SII** | 4 | 0 | 0% | `Definición` |
| **Contabilidad Simple (Fase 2)** | 3 | 0 | 0% | `Definición` |

---

## 🔄 2. Estados de Trazabilidad del Requerimiento

1.  `Definición`: Requerimiento detallado en la especificación SRS, pendiente de validación por el cliente.
2.  `Desarrollo`: Programación activa (base de datos, backend o interfaces).
3.  `Pruebas`: Funcionalidad construida en ambiente sandbox/QA, en proceso de pruebas de integración o pruebas de usuario (UAT).
4.  `Desplegado`: Funcionalidad operativa en producción y validada con firma de conformidad.

---

## 📋 3. Matriz de Requerimientos y Trazabilidad GSP

### A. Ámbito: Captura Operacional & App del Operador (PWA)
*   **REQ-OPS-01: Registro de Orómetro**
    *   *Descripción:* Registro digital de orómetro inicial y final por servicio de grúa en terreno.
    *   *Estado:* `Definición` | *Avance:* 0%
    *   *Tarea vinculada:* `[x] Sergio Gajardo - Presentar maqueta (App Operador)` en `tareas.md`.
*   **REQ-OPS-02: AST y Checklist Pre-operacional Obligatorios**
    *   *Descripción:* Bloqueo de inicio de maniobra si el operador no completa la charla AST y el checklist del equipo.
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-OPS-03: Firma FES de Conformidad**
    *   *Descripción:* Firma electrónica simple con código PIN del supervisor del cliente en terreno con time-stamp criptográfico.
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-OPS-04: Persistencia Offline**
    *   *Descripción:* Guardado en IndexedDB local (`SurveysSnapshot` en `'TransmacSST'`) para registrar datos en zonas sin señal.
    *   *Estado:* `Definición` | *Avance:* 0%

### B. Ámbito: Torre de Control Operacional (Core del Sistema)
*   **REQ-TCO-01: Planificación de Maniobras**
    *   *Descripción:* Asignación mensualizada de grúa, contrapeso, camión de apoyo, operador y rigger.
    *   *Estado:* `Definición` | *Avance:* 0%
    *   *Tarea vinculada:* `[x] Sergio Gajardo - Presentar maqueta (Torre de Control)` en `tareas.md`.
*   **REQ-TCO-02: Semáforo de Acreditación de Seguridad**
    *   *Descripción:* Alertas preventivas antes de despachar un equipo o personal (licencias, exámenes médicos, pases de faena).
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-TCO-03: Panel Kanban de OTs**
    *   *Descripción:* Tablero interactivo con las fases: Planificadas, En Tránsito, En Faena, Ejecutadas, EDP Listo, Facturadas.
    *   *Estado:* `Definición` | *Avance:* 0%

### C. Ámbito: Facturación, Compras y SII (SII / Laudus ERP)
*   **REQ-FIN-01: Gatillador de Factura (Cierre de EDP)**
    *   *Descripción:* Habilitación automática del botón de facturación tras la visación del EDP por parte del cliente y analista.
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-FIN-02: Emisión DTE (SII)**
    *   *Descripción:* Integración con la API del SII de Chile para emitir Facturas Electrónicas Afectas y Exentas de arriendo de maquinaria.
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-FIN-03: Integración Transitoria Laudus ERP (Fase 1)**
    *   *Descripción:* Sincronización bidireccional de clientes, OCs y envío de EDPs valorizados para facturar desde Laudus.
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-FIN-04: Compras y Control de Combustible**
    *   *Descripción:* Orden de compra a proveedores (camas bajas) y registro de combustible Copec/Esmax calculando rendimiento específico.
    *   *Estado:* `Definición` | *Avance:* 0%

### D. Ámbito: Contabilidad Simple Nativa (Fase 2 - Mes 6+)
*   **REQ-CON-01: Plan de Cuentas Parametrizable**
    *   *Descripción:* Estructura contable chilena (Activos, Pasivos, etc.) con consola del contador y conciliación bancaria.
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-CON-02: Asientos Contables por Triggers**
    *   *Descripción:* Triggers PostgreSQL para registrar asientos de cargo y abono automáticos en el Libro Diario al emitir facturas o ingresar compras enlazadas a OC.
    *   *Estado:* `Definición` | *Avance:* 0%
*   **REQ-CON-03: Mayor, Balances y P&L por Grúa**
    *   *Descripción:* Generación del Balance de 8 Columnas y P&L desglosado por grúa (centro de costo).
    *   *Estado:* `Definición` | *Avance:* 0%
