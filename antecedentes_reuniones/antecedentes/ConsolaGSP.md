# 🖥️ Especificación y Adaptación: Consola Operacional Grúas San Pablo (GSP)

Este documento detalla cómo adaptaremos las ideas, diseño y flujos de la **Consola Operacional de Grupo Enlace** al modelo de negocio de **Grúas San Pablo (GSP)**.

---

## 1. Diferencia en los Modelos de Negocio
*   **Grupo Enlace (Brokerage/Intermediario):** No tiene camiones propios. Su labor es cruzar la carga de un cliente con la flota de un tercero (transportista asociado) y ganar un spread, controlando la conciliación entre venta y compra.
*   **Grúas San Pablo (Asset-Heavy / Operador de Activos):** Es dueño de una flota de grúas de alto tonelaje y plataformas en altura. Emplea a sus propios operadores y riggers. Su rentabilidad depende de la **disponibilidad física del activo**, la **acreditación del personal**, la **seguridad operativa (HSE)** y la **rapidez en facturar las horas devengadas**.

---

## 2. Traducción de Roles (Switcher de Perfiles)

| Elemento | Consola Enlace | Consola GSP (Adaptada) |
| :--- | :--- | :--- |
| **Perfil Interno** | **Operador Enlace:** Gestiona negociación comercial, despacho, tarifas de compra y conciliaciones documentales. | **Despacho e Ingeniería GSP:** Controla asignación de grúas, operadores/riggers, planes de rigging, acreditaciones y devengado financiero. |
| **Perfil Externo** | **Transportista Asociado:** Sube facturas de compra y guías de despacho (GD). | **Operador de Grúa (Mobile-First):** Realiza check-list pre-operacional, AST, registra horómetros/horas de trabajo, captura firma digital y sube fotos. |

---

## 3. Adaptación del Dashboard Ejecutivo (Vista 360°)

Mantendremos la estética premium (modo oscuro, HSL tailoring y micro-animaciones) pero adaptando los gráficos de control financiero y logístico:

### A. Gráfico de Flujos (Sankey Diagram)
*   **Enlace:** Muestra el flujo de dinero desde la Venta Cliente ➝ Compra Transportista ➝ Margen Real.
*   **GSP:** Mostrará el flujo de valor del **Devengado** para monitorear el flujo de caja:
    ```
    [Horas Devengadas (Terreno)] ➝ [Estado de Pago (EDP) Aprobado] ➝ [Facturado (SII)] ➝ [Recaudado (Caja/Banco)]
    ```
    *Este gráfico le mostrará al dueño de GSP exactamente en qué etapa administrativa está "atrapado" el dinero de sus servicios realizados.*

### B. Balanza de Conciliación
*   **Enlace:** Compara el volumen de OCs emitidas contra facturas cargadas.
*   **GSP:** Comparará el **Trabajo Devengado (Horas ejecutadas reportadas por la App)** contra la **Facturación Real**. Esto alertará sobre descalces causados por demoras en la emisión de la OC del cliente.

### C. Feed de Alertas Críticas
*   **Enlace:** Alerta sobre viajes atrasados o guías de despacho (GD) faltantes.
*   **GSP:** Alertará sobre:
    *   Grúas en mantenimiento correctivo o mantención preventiva vencida.
    *   Operadores con acreditación vencida (ej: inducción vencida ante CMPC/Arauco).
    *   Servicios completados pendientes de firma digital o aprobación del EDP.

---

## 4. Torre de Control & Kanban (Flujo de Servicios)

Adaptaremos la torre de control y el tablero Kanban al flujo operativo diario de una faena de izaje:

### Columnas del Tablero Kanban de GSP
1.  **Asignado (Preventa / Planificación):** Servicio confirmado. Operaciones asigna la máquina (ej: Liebherr LTM 1100), el operador y el rigger.
2.  **Acreditación & Logística:** En proceso de validación ante el cliente final (cargando exámenes ocupacionales, certificaciones de izaje) y preparando el flete de contrapesos/camas bajas.
3.  **En Maniobra (Ejecutando):** Grúa en sitio realizando el izaje. Operador reportando horas diarias a través de la App móvil (Offline-First).
4.  **Completado (Conciliando):** Servicio terminado. Con reporte firmado digitalmente por el cliente en terreno y esperando facturación.

### Ficha de Expediente 360° (GSP)
Al hacer clic en un servicio, se abrirá un expediente que agrupa:
*   Plan de Rigging (PDF del plano de maniobras).
*   AST firmado digitalmente por los operadores.
*   GPS de la grúa y de la cama baja de traslado.
*   Log de Horómetros (horas de motor y horas de izaje).
*   Evidencia de fotos (estado inicial y final de la carga).
*   Documento de Estado de Pago (EDP).

---

## 5. Doble Conciliación Financiera (Cruce del Devengado)

*   **Enlace:** Cruza la venta del cliente con la compra al transportista para asegurar el spread.
*   **GSP:** Cruzará la **Producción Real en Faena** con la **Aprobación Comercial**:
    *   *Paso 1:* El operador ingresa horas y toma la firma electrónica simple (FES) del cliente en terreno.
    *   *Paso 2:* El analista de GSP en oficina valida que el reporte coincida con el contrato.
    *   *Paso 3:* El sistema genera automáticamente el borrador del Estado de Pago (EDP) eliminando las transcripciones manuales de planillas Excel.
