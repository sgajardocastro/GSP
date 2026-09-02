# 📝 Minuta de Reunión: Revisión de Alcance de Acreditación, Firma Electrónica FES y Plan de Pruebas

**Fecha:** 2026-09-01  
**Participantes:**  
*   **Jorge Ponce** (Asesor Externo - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  
*   **Dayana Riquelme** (Prevencionista de Riesgos / APR - Grúas San Pablo - `driquelme@arriendosanpablo.cl`)  

**Enlaces y Registros:**  
*   [Evento de Calendario](https://calendar.google.com/calendar/event?eid=MjlrODBtb3E4ZmQyYXB1bHU5ZWRlN2s1NGIgc2dhamFyZG9jQG0)  
*   [Transcripción Oficial del Documento](https://docs.google.com/document/d/1VH4hZoTFy0jXjrxbgH4WYYjqmIWPrVL24OAPuW3FsLw/edit?usp=drive_web&tab=t.3pfoeybbznj5)  

---

## 🎯 Objetivos de la Reunión
1.  Definir y acotar el alcance funcional del módulo de **Acreditaciones de Personal y Flota** frente a los requerimientos normativos y clientes mandantes.
2.  Aprobar el mecanismo de **Firma Electrónica Simple (FES con PIN)** para documentos laborales y de seguridad (Anexos de Obra, IRL/ODI, EPP, RIOSS).
3.  Estructurar la organización documental para el modelo **Multi-Empresa** (*Arriendo San Pablo SpA*, *BEstmac*, *Servicios Logísticos*).
4.  Simplificar y optimizar la usabilidad del **Análisis de Seguridad en el Trabajo (AST)** y del **Plan de Izaje** mediante selectores y diagramas visuales.
5.  Planificar el protocolo de **Pruebas Funcionales del Pipeline Comercial** con usuarios clave (*Natalia Giselini* y *Richard Jara*) fijado para el 2 de septiembre.

---

## 💬 Puntos Tratados y Acuerdos Técnicos

### 1. Definición del Alcance: Acreditación Estándar vs. Variaciones por Mandante
*   **Delimitación de Alcance:** Se estableció que gestionar de forma manual e infinita todas las variaciones particulares que cada cliente pueda exigir está fuera del alcance base del software; no obstante, el sistema proveerá los mecanismos para mitigar la carga administrativa al mover trabajadores entre contratos.
*   **Dossier Automatizado:** El sistema detectará la empresa cotizante y la faena asignada para compilar automáticamente solo los documentos exigidos, reduciendo la fricción para el área de Prevención (Dayana).

### 2. Implementación de Firma Electrónica Simple (FES) con PIN de 4 Dígitos
*   **Validez Jurídica DT:** Se aprobó el uso de Firma Electrónica Simple para validar documentos laborales y de seguridad (IRL, AST, EPP, Anexos), cumpliendo con la normativa de la Dirección del Trabajo (DT) mediante autenticación por correo electrónico y código PIN de 4 dígitos.
*   **Accesibilidad Móvil (Sin Apps Nativas):** Los trabajadores accederán a firmar mediante un enlace web seguro (Magic Link / Token Web) enviado a su correo o WhatsApp, eliminando la barrera de instalar aplicaciones móviles nativas y facilitando el uso para personal con menor alfabetización digital.
*   **Resguardo y Auditoría Legal:** Los documentos firmados se almacenan en el expediente digital del trabajador con timestamp inmutable y geolocalización, habilitando acceso transparente en caso de fiscalización de la DT.

### 3. Estructura Documental Multi-Empresa
*   **Distribución por Razón Social:** Se estructuró el repositorio para admitir que la ficha de un trabajador contenga subapartados según la razón social empleadora bajo la cual presta servicios:
    *   *Arriendo San Pablo SpA (ArrSP)* - Temuco / Valdivia.
    *   *BEstmac* - Los Ángeles.
    *   *Servicios Logísticos* - Puerto Montt.
*   **Separación Canónica de Documentos:**
    *   *Documentos Base del Trabajador (Permanentes / Escaneados):* Contrato laboral, exámenes ocupacionales psicosensotécnicos (PST), certificaciones de competencia (Operador / Rigger), hoja de vida del conductor y antecedentes.
    *   *Documentos Dinámicos por Faena (FES / PIN):* Anexo de Cambio de Obra/Traslado, IRL/ODI con vigencia semanal y comprobante de entrega de EPP específico.

### 4. Estandarización de Nomenclatura y Carga Masiva
*   **Control Determinista de Archivos:** Se acordó estandarizar estrictamente los nombres y patrones de archivo para evitar discrepancias de coincidencia en el sistema.
*   **Apoyo de Practicante:** Jorge Ponce gestionará la incorporación de un estudiante en práctica para tabilar y cargar de forma acelerada la documentación histórica de personal y flota.

### 5. Optimización de Usabilidad en Terreno: AST y Plan de Izaje
*   **Ergonomía de Terreno:** Reemplazar los campos de texto libre en el AST y Plan de Izaje por **menús desplegables** (dropdowns) y **diagramas visuales de referencia** que soliciten parámetros numéricos concretos (altura, radio, largo, peso máximo).
*   **Enfoque Preventivo:** Capacitar a los operadores para registrar siempre el peso máximo de izaje proyectado, garantizando compuertas de seguridad operacional antes de iniciar la maniobra.

### 6. Estrategia de Pruebas Funcionales (Comercial ➔ Operaciones)
*   **Foco Inmediato en Preventa:** Se priorizan las pruebas funcionales del flujo comercial (desde la captura de oportunidad, cotización y estructurador, hasta la validación y asignación en Operaciones).
*   **Postergación de Pruebas Offline:** Las pruebas de resiliencia sin conexión (Offline-First en PWA / Viajes) se aplazan para la siguiente semana debido a su alta complejidad operativa y dependencia de datos consolidados.
*   **Sesión de Enrolamiento y Cotización en Vivo:** Programada para el **miércoles 2 de septiembre de 11:00 a 12:00 hrs** con la vendedora *Natalia Giselini* y el coordinador de operaciones *Richard Jara*.

---

## 📌 Matriz de Decisiones Clave

| Decisión | Justificación y Regla de Negocio |
| :--- | :--- |
| **FES con PIN (4 dígitos)** | Autenticación legal y ágil para firma de documentos laborales y de seguridad sin exigir descarga de apps. |
| **Estructura Multi-Empresa** | Organización documental por razón social empleadora (*ArrSP*, *BEstmac*, *Servicios Logísticos*) para asignación cruzada. |
| **Estandarización de Nombres** | Nomenclatura estricta para garantizar coincidencia automática del 100% en los semáforos de acreditación. |
| **AST / Plan de Izaje Visual** | Eliminación de texto libre; uso de selectores rápidos y esquemas con cotas de ingeniería (radio/altura/peso). |
| **Prioridad de Pruebas Comerciales** | Validación del circuito Comercial ➔ Operaciones el 2 de septiembre; funcionalidad Offline postergada a la próxima semana. |

---

## ✅ Plan de Acción y Próximos Pasos

| Responsable | Tarea / Compromiso | Plazo / Fecha |
| :--- | :--- | :--- |
| **Sergio Gajardo** | Configurar el sistema para la carga y clasificación de documentos según requerimientos de Prevención. | Inmediato |
| **Dayana Riquelme** | Entregar el paquete base de formatos y documentación requerida para alimentar la plataforma. | Inmediato |
| **Jorge Ponce** | Contactar al estudiante en práctica para iniciar la tabulación y subida masiva de expedientes. | 2026-09-02 |
| **Sergio Gajardo / Jorge Ponce** | Ajustar y estandarizar el catálogo de nombres de archivos en la plataforma. | 2026-09-02 |
| **Jorge Ponce** | Revisar la figura regulatoria DT respecto a la asignación de trabajadores entre razones sociales del grupo. | 2026-09-04 |
| **Jorge Ponce / Sergio Gajardo** | Diseñar la versión ágil del AST con desplegables y esquema visual para el Plan de Izaje. | 2026-09-03 |
| **Jorge Ponce / Sergio Gajardo** | Ejecutar la sesión de prueba funcional comercial con Natalia Giselini y Richard Jara. | **2026-09-02 (11:00 hrs)** |
| **Sergio Gajardo** | Incorporar a Richard Jara (`logistica@arriendosanpablo.cl`) en la citación de la prueba. | 2026-09-01 |
| **Jorge Ponce** | Compartir los datos de contacto de Natalia Giselini para asegurar su enrolamiento en el sistema. | 2026-09-01 |

---

## ⏱️ Trazabilidad de la Sesión

*   `00:00:02` - Inicio y contexto del sistema de acreditación y eficiencia operativa.
*   `00:03:25` - Definición de alcance del proyecto vs. variaciones de acreditación por cliente.
*   `00:07:09` - Solución de firma electrónica simple con PIN para IRL y AST.
*   `00:09:57` - Accesibilidad mediante enlaces web en lugar de aplicaciones nativas.
*   `00:15:10` - Estructura de carpetas documentales por empresa empleadora (*San Pablo*, *BEstmac*).
*   `00:16:27` - Automatización de dossiers y entrega de requisitos por faena.
*   `00:18:27` - Acceso digital y resguardo legal para fiscalizaciones de la Dirección del Trabajo.
*   `00:20:37` - Aspectos regulatorios internos sobre asignación de personal multi-empresa.
*   `00:28:38` - Demostración del módulo comercial y despacho de dossiers por enlaces directos.
*   `00:31:29` - Gestión y acreditación de personal externo (Riggers contratistas).
*   `00:34:23` - Proceso de enrolamiento express en 3 minutos.
*   `00:36:29` - Estandarización de nombres de documentos y eliminación de discrepancias.
*   `00:38:48` - Planificación de recursos de apoyo (practicante) para carga de datos.
*   `00:41:41` - Criterios del AST y Plan de Izaje enfocado en peso máximo de carga.
*   `00:45:27` - Sustitución de texto libre por menús desplegables y esquemas técnicos.
*   `00:49:06` - Estandarización de procedimientos para reducir dependencia de personas clave.
*   `00:54:35` - Visión de autonomía operativa mediante procesos digitales integrados.
*   `00:57:00` - Continuidad del proyecto y proyección hacia módulos de inventario y taller.
*   `00:58:25` - Definición de estrategia de pruebas iniciales enfocadas en el área comercial.
*   `00:59:58` - Postergación de pruebas de funcionalidad Offline para la siguiente semana.
*   `01:01:26` - Coordinación de prueba real de cotización con Natalia Giselini el 2 de septiembre.
*   `01:04:44` - Integración de Richard Jara (Operaciones) para validación de flujo punta a punta.
*   `01:07:07` - Acuerdos finales y cierre logístico de la reunión.
