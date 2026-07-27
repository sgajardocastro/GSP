# 🏗️ Referencia de Negocio y Lógica de Cotización (Transmac)

Este documento detalla la estructura comercial, los componentes operativos de la tripulación, la logística de traslado y la lógica de cálculo utilizadas en el módulo de grúas de **Transmac**, el cual sirve de referencia técnica para el desarrollo del sistema de **Grúas San Pablo (GSP)**.

---

## 1. Flujo del Proceso Comercial de Grúas

A diferencia de los arriendos tradicionales o los servicios de transporte estándar, un servicio de grúas es un proceso complejo debido a la naturaleza crítica de la elevación de cargas pesadas. El flujo en el sistema se divide en tres fases principales:

### A. Fase de Preventa (Contacto y Oportunidad)
*   **Filtro Temprano:** Al calificar la oportunidad de negocio y seleccionar el tipo de servicio como **Grúas (código `100151`)**, el sistema restringe el equipamiento al tipo **Grúas (código `100126`)**.

### B. Fase de Cotización (Estructuración de Costos)
*   **Componente Dinámico:** Si la oportunidad se identifica como grúa, el sistema monta un componente especializado (`tm-item-gruas.js`) que desglosa la cotización en una grilla de costos agrupados por la naturaleza operativa del izaje, en vez de una tabla estándar de arriendos lineales.
*   **Exportación consolidada:** Permite generar el PDF consolidado del ítem de grúa.

### C. Fase de Postventa
*   Cierre de la cotización, generación de contratos y vinculación con la operación y el mantenimiento.

---

## 2. Variables y Componentes Críticos del Negocio de Grúas

### A. Especificación e Identificación del Equipo (Maquinaria)
*   **Marca y Modelo:** En grúas, la capacidad nominal cambia radicalmente según el modelo, ya que este define la **tabla de carga (Load Chart)** del equipo.
*   **Patente / Equipo Específico:** Identificación única del recurso físico. Es mandatorio asignar una unidad física específica porque cada grúa requiere certificaciones de izaje anuales vigentes (otorgadas por entes como Bureau Veritas o LSQA) y bitácoras de cables para ingresar a faena.
*   **Capacidad en Toneladas e Indicadores de Pluma:** Límites físicos específicos de resistencia mecánica y momento de vuelco según el radio de operación.
*   **Periodo de Arriendo y Valor del Periodo:** Unidad temporal de cobro (Día, Mes, Hora) y su tarifa base.

### B. Perfiles de Tripulación Especializada (Recurso Humano)
Cada perfil operativo cuenta con variables de Cantidad (Q), Valor Unitario y Valor Total:
*   **Operador de Grúa:** Conductor y operador en cabina, calificado y certificado según el tonelaje del equipo.
*   **Rigger (Aparejador/Señalero):** Encargado de calcular y colocar las eslingas, grilletes y estrobos a la carga, y guiar al operador mediante señales de mano o radio. Un izaje no se realiza sin un rigger.
*   **Prevencionista de Riesgos (HSE):** Requerido para izajes críticos (cargas sobre el 80% de capacidad de la grúa, maniobras tándem con dos grúas, o izajes cerca de líneas de alta tensión).
*   **Supervisor de Izaje:** Responsable general de la maniobra en terreno. Valida estabilidad del suelo, velocidad del viento y firma el permiso de trabajo.
*   **Vientero:** Personal a cargo de estabilizar la carga mediante cuerdas de guía (vientos o taglines).

### C. Logística y Movilización (Transporte)
Montos fijos de traslado e ingreso/salida de faena:
*   **Traslado de la Grúa (Ida y Retorno):** Costos de combustible y conducción del propio equipo al sitio (baja velocidad vial y alto consumo).
*   **Camioneta Escolta:** Requerido por ley o seguridad interna para grúas de gran envergadura (sobredimensión) que circulan por vías públicas.
*   **Traslado Contrapesos Cama Baja:** Transporte de placas de contrapeso pesado usando semirremolques de cama baja para cumplir con los límites de peso por eje en carretera (las grúas de alto tonelaje no pueden circular con sus contrapesos instalados por carretera).
*   **Traslado Contrapesos Rampla Plana:** Transporte de accesorios y contrapesos estándar mediante ramplas planas tradicionales.

### D. Otros Costos Operativos y de Ingeniería
*   **Gastos Varios:** Viáticos de la tripulación, combustibles extras o insumos.
*   **Mantención en Terreno:** Soporte mecánico preventivo/correctivo o lubricación en faenas de larga duración.
*   **Permisos Viales:** Autorizaciones gubernamentales de tránsito para cargas sobredimensionadas o pesadas.
*   **Maniobras de Izaje (Rigging Engineering):** Costo de estudios de ingeniería de izaje, planos de maniobra, cálculo de presiones sobre el suelo (para evitar que la grúa se entierre y vuelque) y configuración de aparejos especiales (grilletes, eslingas, vigas esparcidoras).

---

## 3. Lógica de Cálculo de la Cotización

1.  **Subtotales por Bloque:**
    *   $$Subtotal_{Equipos} = \sum (ValorPeriodo \times Q_{Equipos})$$
    *   $$Subtotal_{Tripulación} = \sum (Cant_{Perfil} \times ValorUnit_{Perfil})$$
    *   $$Subtotal_{Logistica} = CamionetaEscolta + TrasladoGrua + ContrapesosCamaBaja + ContrapesosRamplaPlana + Retorno$$
    *   $$Subtotal_{Otros} = GastosVarios + Mantenciones + Permisos + Maniobras$$
2.  **Cálculo Neto y Total:**
    *   $$Neto = (Subtotal_{Equipos} + Subtotal_{Tripulación} + Subtotal_{Logistica} + Subtotal_{Otros}) - Descuento$$
    *   $$IVA = Neto \times 0.19$$ (IVA estándar chileno)
    *   $$Total = Neto + IVA$$
