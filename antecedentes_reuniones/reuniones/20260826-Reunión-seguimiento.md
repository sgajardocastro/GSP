# 📝 Minuta de Reunión: Seguimiento Operativo, Despacho y Preparación de Presentación GSP

**Fecha:** 2026-08-26  
**Participantes:**  
*   **Jorge Ponce** (Asesor Externo - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (LeanGlobal)  

---

## 🎯 Objetivos de la Reunión
1.  Revisar la alineación operativa y la transición de responsabilidades en Operaciones, Contabilidad y Comercial programada para el inicio del ciclo operativo.
2.  Definir la separación funcional entre el **Control de Flota Interno** (viaje y telemetría) y el **Reporte Diario** (cara al cliente / facturación).
3.  Establecer la regla de **fragmentación y despacho escalonado** por unidad de equipo.
4.  Consolidar el protocolo del **Análisis de Seguridad en el Trabajo (AST / ART)** y checklist completo de patio.
5.  Coordinar la agenda, dinámicas y presentación presencial del sistema programada para el día siguiente.

---

## 💬 Puntos Tratados y Alineación Operativa

### 1. Separación Funcional: Control de Flota vs. Reporte Diario
*   **Control de Flota (Interno):** Gestiona el desplazamiento logístico de la máquina (salida de patio, inicio de trayecto, llegada a faena, retorno y llegada a base), capturando odómetros, horómetros y control de recarga de combustible con tarjeta Copec (obligatoria si el estanque baja de $3/4$, considerando equipos con múltiples estanques).
*   **Reporte Diario de Izaje ("Report" / Cara al Cliente):** Documento formal de avance enfocado en las horas efectivas de servicio, horario citado vs. real, pausas de colación, horas de sobretiempo, geolocalización y firma de conformidad digital del receptor mandante en terreno (ej. Juanito Pérez), constituyendo el insumo base para la liquidación del Estado de Pago (EDP).

### 2. Despacho Escalonado y Fragmentación de Servicios por Equipo
*   Se analizó que la salida a faena no siempre es un hito monolítico de todo el proyecto; puede **fragmentarse por unidad** debido a mantenciones mecánicas imprevistas, disponibilidad escalonada de operadores o requerimientos diferidos del cliente.
*   El sistema desacopla el estado macro del proyecto del estado micro por máquina (`tpry_rel_equipo` / `tequ_log_desplazamiento`), requiriendo autorización del área comercial (Omar) ante cambios en las fechas de inicio de cada equipo.

### 3. Flexibilidad e Ingreso Manual de Horarios (Fase de Adopción)
*   Para facilitar la curva de adopción y transición operativa, el sistema permitirá el ingreso y ajuste manual de horarios de inicio y término.
*   Se incorporará el **cálculo automático del total de horas de la jornada** visible debajo de los campos de horarios en la interfaz de usuario.
*   Se habilitará el ingreso manual del número de Orden de Trabajo (OT) para asociar registros al sistema actual (*Jalsoft*) mientras se completa la migración definitiva.

### 4. Protocolo de Seguridad: AST por Equipo Individual
*   Se determinó que el **Análisis de Seguridad en el Trabajo (AST / ART)** se ejecutará de forma inicial y por cada equipo de manera individual, involucrando a su operador y rigger asignados para su supervisión directa en el perfil del área de prevención (Dayana).

### 5. Checklist Completo de Inspección de Patio y Control de Maniobras
*   El checklist de inspección de recepción/despacho en patio (gestionado por el jefe de patio o guardia José) debe mantener el **alcance exhaustivo** de generalidades y elementos de izaje sin simplificaciones.
*   Se enfatizó el control riguroso de las eslingas y aparejos de izaje (con valores de hasta $3.000.000 por juego) para evitar pérdidas y disputas de responsabilidad entre operadores.
*   **Formato PDF:** Se ajustará la generación de reportes PDF para imprimir las descripciones completas de estado (*"Bueno"*, *"Malo"*, *"Regular"*) en lugar de iniciales abreviadas (*"B"*, *"M"*, *"R"*).

### 6. Contratos de Arriendo de Plataformas (Sin Operador)
*   La definición funcional y contractual para plataformas sin operador se mantiene en pausa (**Pospuesta**) a la espera de una sesión de trabajo con el área legal/abogada para estructurar contratos con firma electrónica y checklists de control periódico del activo.

### 7. Estados de Pago (EDP), Pre-Facturación y Pilares del Proyecto
*   Se revisaron los flujos de cobro (diario, mensual, fijo), identificando la necesidad de reducir retrasos actuales de hasta un mes por falta de backoffice mediante un modelo progresivo.
*   Se ratificó que el avance global del proyecto **supera el 50%** estructurado en **4 pilares estratégicos**:
    1.  *Pilar Operativo:* Ciclo Comercial y Operaciones en terreno.
    2.  *Pilar Analítico y de Gestión:* Torre de Control, KPI y validación.
    3.  *Pilar de Inventario y Taller:* WMS-Lite, repuestos y mantenimiento de flota.
    4.  *Pilar Contable:* Integración con Facturación ERP / Laudus y SII.

---

## 📌 Decisiones Clave Acordadas

| Decisión | Detalle y Regla de Negocio |
| :--- | :--- |
| **Fragmentación de Servicios** | Salida y ejecución flexible y segmentable por unidad de equipo en lugar de un bloqueo monolítico. |
| **Separación Flota vs. Report** | `Control Flota` para logística interna/viaje y `Reporte Diario` para horas facturables y firma mandante. |
| **Cálculo Horario Reactivo** | Despliegue del total de horas calculadas de la jornada en la interfaz de registro. |
| **AST Individual por Equipo** | Generación de AST por máquina vinculando a su operador y rigger específico. |
| **Checklist Exhaustivo de Patio** | Inclusión obligatoria de todos los puntos de inspección y control de lingas/aparejos de alto valor. |
| **Valores Completos en PDF** | Impresión de etiquetas completas (*Bueno / Regular / Malo*) en los reportes exportados. |

---

## 🤝 Compromisos y Próximos Pasos (TODOs)

| Tarea / Entregable | Responsable | Prioridad | Estado |
| :--- | :--- | :---: | :---: |
| **Agregar cálculo horario en UI:** Mostrar el total de horas de la jornada bajo los inputs de inicio/término. | Sergio Gajardo | Alta | Pendiente |
| **Homologar Control Flota vs Report:** Separar claramente la nomenclatura y navegación entre ambos módulos. | Sergio Gajardo | Alta | En Curso |
| **Ajustar formato PDF de Checklist:** Imprimir texto completo (*Bueno, Regular, Malo*) en lugar de iniciales. | Sergio Gajardo | Media | Pendiente |
| **Preparar presentación presencial:** Desarrollar el material técnico y soporte del enfoque sistémico. | Sergio Gajardo | Alta | En Curso |
| **Confirmar agenda por audio WhatsApp:** Confirmar viabilidad del cronograma de reuniones de la tarde. | Sergio Gajardo | Alta | Pendiente |
| **Coordinar dinámica y cronograma:** Estructurar el horario de la presentación y dinámica de equipo con globos. | Jorge Ponce | Alta | En Curso |
| **Agendar sesiones individuales de la tarde:** Coordinar bloques de 30 min con Secretaria, Contabilidad, Operador y Coordinador. | Jorge Ponce | Alta | Pendiente |
| **Conversar con Prevencionista:** Tratar con Dayana el protocolo y periodicidad del AST simple por equipo. | Jorge Ponce | Media | Pendiente |
| **Reenviar foto de impresora:** Compartir nuevamente la fotografía de referencia de la impresora de patio. | Jorge Ponce | Baja | Pendiente |

---

## 🎪 Estructura de la Presentación Presencial (Jueves 27-Ago)

*   **Lugar:** Quincho Casa Matriz GSP.
*   **Horario de Inicio:** 10:30 hrs.
*   **Bloque 1 (10:30 - 10:35):** Introducción de dolores operativos y visión de cambio por Jorge Ponce (3 a 5 min).
*   **Bloque 2 (10:35 - 11:30):** Exposición técnica interactiva del sistema y flujo integrado por Sergio Gajardo (1 hora).
*   **Bloque 3 (11:30 - 13:00):** Dinámica grupal participativa con globos (18 personas, 5 min) y espacio de diálogo abierto con el equipo previo al almuerzo.
*   **Bloque 4 (Tarde):** Sesiones de trabajo individuales de 30 minutos con áreas clave (Secretaría, Contabilidad, Operador representativo y Coordinador de Operaciones).
