# 📝 Minuta de Reunión: Segunda Sesión Marcha Blanca — Requerimientos Urbanos, Caso 5 Estructurador, Categorización Camión Plataforma y Registro de Combustible

**Fecha:** 2026-09-30  
**Contexto:** Segunda jornada de pruebas y marcha blanca operativa en vivo del software LeanGlobal para Grúas San Pablo (GSP).  
**Participantes:**  
*   **Jorge Ponce** (Gerente General - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  
*   **Yiara Mendoza** (Control de Gestión y Flota - Grúas San Pablo - `controlflota@arriendosanpablo.cl`)  
*   **Richard Jara** (Coordinación de Logística y Operaciones - Grúas San Pablo - `logistica@arriendosanpablo.cl`)  

**Enlaces y Registros:**  
*   [Evento de Calendario](https://calendar.google.com/calendar/event?eid=NWtiNmdxbWRzMDZjbjlrbjZlNnE2MmhmNm8gc2dhamFyZG9jQG0)  
*   [Transcripción Oficial Google Docs](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?usp=drive_web&tab=t.9mbyn57w8w1y)  

---

## 🎯 Resumen Ejecutivo

Revisión en vivo de los requerimientos urbanos y resolución de incidentes en el flujo de cotizaciones comerciales y registro de combustible en terreno.
1. **Requerimiento y Cotización Comercial:** Se constató la creación exitosa y expedita de un requerimiento urbano para el cliente **Ingebec** (~3 minutos de procesamiento). En paralelo, se analizó el incidente reportado en la cotización **11427** de **Comercial Caufman** (a cargo de Natalia Ghisellini), donde el estructurador comercial bloqueaba el flujo al obligar a ingresar una tercera línea de contrapeso para un servicio que no la requería.
2. **Categorización de Equipos:** Se abordó el caso de traslado de maquinaria de terceros (retroexcavadora sobre camión plataforma), acordándose modificar la subcategoría en sistema de *Grúa Telescópica* a *Camión Plataforma*.
3. **Estructurador Comercial (Quinto Caso):** Se acordó incorporar formalmente el **Caso 5 (Especial / Mixto Libre / Flete Puro)** en el estructurador comercial para permitir combinaciones libres sin forzar líneas obligatorias de contrapesos ni grúa GSP en servicios de flete.
4. **Demostración de Combustible en PWA:** Simulación y registro exitoso de una recarga de 20 litros ($30.000) con captura de odómetro, fotografía de tablero y confirmación de seguridad con PIN 2207 en la aplicación móvil ante Richard Jara y el equipo de operaciones.

---

## ✅ Decisiones Acordadas

### 1. Ajuste de Líneas y Creación del Quinto Caso en Estructurador
*   **Problema:** El estructurador canónico de 4 casos forzaba de forma rígida una tercera línea de flete de contrapeso cuando la distancia superaba el radio urbano o se agregaba flete, impidiendo cotizar servicios de flete puro o traslados de maquinaria en cama baja/rampla sin contrapesos.
*   **Acuerdo:** Incorporar un **Quinto Caso (Caso 5: Especial / Mixto Libre / Flete Puro)** en el estructurador comercial (`GestorOportunidades.vue`), permitiendo canasta libre sin exigencia obligatoria de grúa de flota propia ni traslados de contrapesos, persistiendo `tipo_caso: 5` como metadato en `crm_v1` para efectos de control de gestión (Yiara Mendoza) y auditoría.

### 2. Modificación de Subcategoría para Servicios de Traslado
*   Se acordó habilitar/ajustar la subcategoría de **Camión Plataforma** (en lugar de grúa telescópica) para maquinaria específica y traslados de terceros (ej. retroexcavadoras), especificando una glosa de soporte de traslado para el cliente.

### 3. Validación de Flujo de Carga de Combustible
*   Se ratifica el funcionamiento del módulo de combustible en la PWA del conductor/operador tras la prueba en vivo: ingreso de 20 litros, monto de $30.000, odómetros correlativos, nivel de estanque al arribo faena (99%), captura fotográfica del odómetro/tablero y firma digital mediante PIN 2207.

---

## 📋 Próximos Pasos y Asignación de Tareas

| Responsable | Tarea / Entregable | Estado |
| :--- | :--- | :--- |
| **Sergio Gajardo** | **Agregar Quinto Caso:** Implementar un nuevo caso en el estructurador del software para gestionar los servicios de traslado que no requieren una tercera línea de contrapeso, permitiendo canasta libre y selección de categorías como plataforma para maquinaria específica. | ✅ Implementado Localmente (Sin Desplegar) |
| **Sergio Gajardo** | **Enviar Enlace a Richard Jara:** Reenviar el link de acceso al sistema a Richard Jara (`logistica@arriendosanpablo.cl`), utilizando su número telefónico de contacto para facilitar su inicio de sesión con correo corporativo. | 🟡 Pendiente |
| **Jorge Ponce** | **Finalizar Ruta:** Completar la carga de datos faltantes en el registro de hoja de ruta en curso. | 🟡 Pendiente |
| **Jorge Ponce, Sergio Gajardo** | **Ingresar Reporte:** Ejecutar la entrada de un reporte en la aplicación para verificar la visualización y sincronización compartida entre los usuarios. | 🟡 Pendiente |

---

## 🔍 Detalle Cronológico de la Sesión

*   **Creación de requerimiento urbano para Ingebec:** Jorge Ponce informó que creó un requerimiento urbano para la empresa Ingebec en el software, un proceso expedito que tomó aproximadamente tres minutos. Jorge Ponce añadió que se encontraba revisando otro requerimiento de tipo rural que incluyera servicio de traslado ([00:00:01](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.9mbyn57w8w1y#heading=h.xjkzjywexnq8)).
*   **Problema en cotización de Comercial Caufman:** Sergio Gajardo planteó un problema en el proceso de la cotización 11427 de Comercial Caufman a cargo de Natalia Ghisellini, donde el sistema obligaba a colocar tres líneas en el estructurador de servicios a pesar de que solo se necesitaban dos líneas correspondientes al valor fijo y al traslado de la grúa, sin requerir traslado de contrapeso. Jorge Ponce detalló los tres tipos de cobro existentes (valor hora, valor mensual y valor fijo), explicando que el sistema exigía agregar una tercera línea innecesaria para el traslado de contrapeso ([00:01:04](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.9mbyn57w8w1y#heading=h.42zn3onuh64r)). Sergio Gajardo revisó el sistema y constató que el estructurador tenía seleccionado el caso rural con fletes, grúas y contrapesos ([00:02:03](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.9mbyn57w8w1y#heading=h.jtbdteramlbd)).
*   **Categorización de equipos en el sistema para el caso rural:** Sergio Gajardo y Jorge Ponce analizaron el tipo de equipo asociado al servicio, aclarando que no correspondía a una grúa sino a una retroexcavadora que se transportaba sobre un camión plataforma ([00:03:15](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.9mbyn57w8w1y#heading=h.sdjsmwhfutw6)). Jorge Ponce solicitó modificar la subcategoría en el sistema de grúa telescópica a camión plataforma, especificando una descripción de soporte de traslado para el cliente ([00:04:31](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.gpfxvapkzh17)).
*   **Resolución del problema de líneas en el estructurador:** Sergio Gajardo identificó la causa del problema, señalando que al estar marcado el caso sugerido con contrapesos, el sistema impedía el envío al agregar un traslado adicional en cama baja o rampla. Sergio Gajardo determinó que esto se resolvería manejando un quinto caso o ajustando las líneas en el estructurador, tras lo cual Jorge Ponce solicitó unos minutos para resolver un asunto interno ([00:05:59](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.4go118eta0vv)).
*   **Integración de nuevos participantes y revisión del software:** Jorge Ponce retomó la comunicación incorporando a Richard y a Yiara a la reunión, presentando a Richard como la persona encargada de plantear las dudas sobre el software. Sergio Gajardo coordinó el reenvío del enlace de acceso a Richard y procedió a compartir su pantalla para dar contexto sobre los casos comerciales generados entre la jornada previa y el día actual, a pesar de las dificultades de conexión mencionadas ([00:07:25](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.obweepmeeqxx)).
*   **Demostración y Registro de Carga de Combustible:** Jorge Ponce abordó el estado de una hoja de ruta, explicando que la tarea quedó inconclusa debido a la interrupción de una llamada telefónica. Durante la revisión en pantalla compartida, Jorge Ponce realizó una simulación para registrar una carga de combustible especificando 20 litros cargados, un monto de 30.000, configurando el odómetro, tomando una fotografía del tablero y ejecutando la confirmación de la carga. Como resultado, Jorge Ponce completó exitosamente el proceso y verificó el registro de la carga de combustible ante Richard.
*   **Registro de combustible y odómetros en la aplicación:** Jorge Ponce detalló el proceso de registro de una carga de 20 litros de combustible, ingresando valores de odómetro como 1222, 2344 y 2345, un nivel de combustible del 99% al llegar a la obra, y el número PIN 2207 para confirmar la transacción y comprobar la telemetría en la plataforma ([01:18:44](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.avg9qt46je43)).
*   **Revisión de la bitácora cronológica y consultas sobre WhatsApp:** Jorge Ponce analizó la bitácora cronológica de la ruta que comprende la salida del patio y la llegada a la faena, señalando ligeras discrepancias de precisión en el teléfono móvil y planteando dudas sobre WhatsApp ([01:20:17](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.h1ev97uryjmk)).
*   **Ingreso de reportes en la aplicación:** Jorge Ponce y Sergio abordaron el procedimiento para ingresar un reporte mediante el botón habilitado en la aplicación, gestionando la continuidad tras llamadas telefónicas y revisando aspectos técnicos del micrófono abierto ([01:20:17](https://docs.google.com/document/d/1CpWKpBslmIxnC61FRL0RI49ZDl_tVmAgPe8iZo3zJDg/edit?tab=t.h1ev97uryjmk)).
