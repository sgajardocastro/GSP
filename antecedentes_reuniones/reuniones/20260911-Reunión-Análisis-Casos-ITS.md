# 📝 Minuta de Reunión: Validación de POC, Casos de Cobro ITS y Simplificación Operativa

**Fecha:** 2026-09-11  
**Participantes:**  
*   **Jorge Ponce** (Gerente General - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  

**Enlaces y Registros Oficiales:**  
*   [Evento de Calendario](https://calendar.google.com/calendar/event?eid=MzhtY2dnZnY3dm9vNjlzOG9hZW9vNDZwamUgc2dhamFyZG9jQG0)  
*   [Transcripción Oficial](https://docs.google.com/document/d/1kfoQgzpa49QCfVP-qGO5g5SlxCoOofhL6f3qG9zV1A8/edit?usp=drive_web&tab=t.c084wna693m5)  

---

## 🎯 Resumen Ejecutivo

Sesión técnica de revisión en vivo de la **Prueba de Concepto (POC)** del cotizador comercial con el umbral de los 30 km. Se validó y convalidó la eliminación definitiva de la bandera manual de flete, acordando el mapeo oficial de **4 escenarios de cobro** según ubicación (Urbano/Rural) y requerimiento de contrapesos. 

Se estableció el desglose estricto de **tres líneas separadas de cobro para el Caso 4 (Rural con Contrapesos)**, la regla de ingreso de kilometraje de ida con duplicación interna automática para costos (ida y vuelta), la depuración urgente de la aplicación móvil del operador eliminando visores técnicos innecesarios, y el cronograma para iniciar **pruebas en paralelo con vendedores a partir del 21 de septiembre de 2026**.

---

## ✅ Acuerdos y Decisiones de Negocio

### 1. Convalidación de los 4 Escenarios de Cobro y Facturación

Se zanja de forma definitiva la casuística de facturación según distancia y configuración de equipo:

* **Caso 1: Urbano sin Contrapeso ($\le 30\text{ km}$, grúas $< 90\text{T}$):**
  * Se cobran únicamente las horas de arriendo de la grúa.
  * El cómputo de tiempo inicia formalmente al salir de Casa Matriz o sucursal y concluye al término de la maniobra (`hora_salida ➔ hora_termino`).
  * **Sin cobro de flete (\$0).**
* **Caso 2: Urbano con Contrapeso ($\le 30\text{ km}$, grúas $\ge 90\text{T}$ a $400\text{T}$):**
  * Se cobran las **horas de arriendo de la grúa** (desde salida de base hasta término de faena).
  * Se agrega una línea única denominada **"Traslado Contrapesos"** a valor fijo a todo evento, independientemente de la cantidad de tractocamiones requeridos.
* **Caso 3: Rural sin Contrapeso ($> 30\text{ km}$, grúas $< 90\text{T}$):**
  * Se cobran las **horas de arriendo en faena** (desde arribo a portería de la obra: `hora_llegada ➔ hora_termino`).
  * Se cobra obligatoriamente la línea **"Flete / Traslado de Grúa"** (valor cerrado ida y vuelta).
* **Caso 4: Rural con Contrapeso ($> 30\text{ km}$, grúas pesadas con camas bajas):**
  * **Decisión Clave:** Se estructuran **TRES LÍNEAS SEPARADAS DE COBRO** en la cotización y en la factura:
    1. `Horas de Arriendo Grúa` (operación efectiva en obra).
    2. `Flete / Traslado Grúa` (movilización vial de la grúa telescópica).
    3. `Traslado de Contrapesos` (tractocamión / cama baja de bloques de contrapeso).
  * **Razón Estratégica de Jorge Ponce:** Transparencia total para el mandante y habilitación de auditoría exacta de costos operacionales de combustible y desgaste por patente y equipo en el ITS.

### 2. Flexibilidad Paramétrica en Horas Mínimas Base
* Se determinó que los servicios no deben quedar encasillados en un mínimo fijo rígido (ej. 4 u 8 horas inamovibles), debido a que intervienen variables críticas de faena: turnos nocturnos, días feriados, maniobras de urgencia o ventanas climáticas.
* **Regla:** El sistema sugerirá la base habitual, pero el campo de **Horas Mínimas Garantizadas** permanecerá editable por el vendedor en la cotización comercial.

### 3. Registro de Kilometraje: Ingreso de Ida con Duplicación Interna
* **Experiencia de Usuario (Comercial):** El vendedor digita únicamente la **distancia vial de IDA** (ej. `35 km`) para evitar confusiones al cotizar.
* **Capa Interna del Sistema:** El backend multiplica automáticamente por 2 ($35 \times 2 = 70\text{ km}$) para calcular el recorrido total de ida y retorno.
* **Impacto en Costos:** El módulo de costos operacionales del ITS (combustible, peajes y desgaste) evalúa la ruta completa de ida y vuelta para reflejar el margen real del negocio.

### 4. Erradicación del Flag Manual de Flete
* Queda formalmente eliminado el combobox `incluye_flete: SÍ / NO`.
* El comportamiento comercial queda gobernado de forma matemática por la distancia ingresada y la selección de contrapesos.

### 5. Simplificación Radical de la Interfaz Móvil del Operador (PWA)
* Al revisar la prueba en terreno enviada por WhatsApp, Jorge Ponce constató que la pantalla del chofer contiene sobrecarga de información técnica y botones innecesarios (como el "log maestro").
* **Mandato de Limpieza:** Dejar una vista limpia, robusta y ergonómica con **únicamente los botones esenciales de terreno**:
  1. `[ Salida de Patio ]`
  2. `[ En Ruta ]`
  3. `[ Llegada a Obra / Inicio ]`
  4. `[ Término de Maniobra ]`
  5. `[ Sellar Reporte Diario ]`
* Todas las vistas técnicas avanzadas, logs de eventos y telemetría quedan reservados exclusivamente para los analistas en la Torre de Control.

### 6. Depuración de Redundancias en Torre de Control (Calidad vs. Patio)
* Se identificó duplicidad entre las pestañas "Calidad de Gestión" e "Inspección de Patio", las cuales corresponden a la misma labor física del Jefe de Patio.
* **Ajuste:** Eliminar la pestaña redundante de "Calidad". La inspección de patio con lista de chequeo en tablet centraliza la revisión de salida y retorno de máquinas, notificando al analista de flota.

### 7. Nuevo Rol de Auditoría y Control GPS
* Se incorpora formalmente al flujo el rol del **Analista de Flota & Auditoría Contable** (asumido recientemente por personal de auditoría interna de GSP).
* Su labor consistirá en monitorear servicios no reportados, validar inicios de jornada contra el GPS del camión/grúa y conciliar la información junto al coordinador Richard.

---

## 📋 Próximos Pasos (TODOs) & Cronograma de Pruebas

| Tarea / Entregable | Responsable | Plazo Límite | Estado |
| :--- | :--- | :--- | :--- |
| **Limpieza de Interfaz Móvil (Viajes PWA):** Eliminar log maestro y botones técnicos; dejar solo los 5 estados esenciales de terreno. | Sergio Gajardo | 15-09-2026 | Pendiente |
| **Eliminar Redundancia de Calidad:** Remover pestaña de calidad en Torre de Control y consolidar en Inspección de Patio. | Sergio Gajardo | 15-09-2026 | Pendiente |
| **Duplicación Interna de Distancia:** Implementar cálculo automático de ida y vuelta ($D \times 2$) en el backend/modelo. | Sergio Gajardo | 15-09-2026 | Pendiente |
| **Configurar 3 Líneas para Caso 4:** Estructurar cotizador para inyectar automáticamente horas grúa, flete grúa y flete contrapesos en rural pesado. | Sergio Gajardo | 15-09-2026 | Pendiente |
| **Enviar Mapa Didáctico del Flujo:** Elaborar y remitir a Jorge Ponce el mapa visual de entregables y artefactos por etapa. | Sergio Gajardo | 15-09-2026 | Pendiente |
| **Punto de Control Telefónico:** Contactar a Jorge Ponce para reportar avances de los ajustes. | Sergio Gajardo | 15-09-2026 (Tarde) | Agendado |
| **Sesión de Revisión Integral:** Sesión de trabajo para validar cotización, verificación, PWA e ITS corregidos. | Sergio G. & Jorge Ponce | 16-09-2026 | Agendado |
| **INICIO DE PRUEBAS EN PARALELO:** Iniciar pruebas reales del sistema en paralelo con 1 o 2 vendedores en Casa Matriz. | Equipo Comercial & TI | **21-09-2026** | Comprometido |

---

## 📅 Hito Clave
* **Lunes 21 de Septiembre de 2026:** Lanzamiento de marcha blanca y pruebas en paralelo en Casa Matriz con vendedores reales, utilizando las nuevas reglas de cotización y despacho sin banderas manuales.
