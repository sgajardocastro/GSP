# Minuta de Reunión: Seguimiento GSP / LeanGlobal

**Fecha:** 2026-07-20  
**Participantes:**  
*   Jesus Acevedo (`jesus.acevedo.sanpablo@gmail.com`)  
*   Jorge Ponce (`jponce@arriendosanpablo.cl`)  
*   Sergio Gajardo (`sgajardo@leanglobal.cl`)  

---

## 📌 Resumen Ejecutivo
La reunión definió mejoras operativas mediante la implementación de nuevos atributos, flujos de trabajo y documentación centralizada.

1.  **Ajustes en Cotizaciones y Procesos:** Se implementaron nuevos atributos obligatorios en cotizaciones y se automatizó el guardado al generar archivos PDF. También se estandarizó la terminología del sistema, renombrando estados y unidades de cobro para evitar confusiones.
2.  **Operaciones y Flujo de Trabajo:** Se estableció un flujo de órdenes de trabajo donde operaciones gestiona las asignaciones tras la solicitud del vendedor. Además, se integró el formulario digital para visitas a terreno con sincronización de datos en tiempo real.
3.  **Gestión Documental y Desarrollo:** Se acordó centralizar el registro de observaciones en un documento compartido para organizar el backlog del Producto Mínimo Viable (MVP). Se priorizó la migración de inventarios y certificados, delegando la gestión de datos a tareas manuales colaborativas.

---

## 🛠️ Detalles de la Discusión

### 1. CRM, Cotizaciones y Clientes
*   **Nuevos atributos de cotización:** Se implementarán atributos obligatorios para la creación de cotizaciones. Aunque esto podría generar cierta resistencia inicial, es necesario para optimizar el proceso operativo.
*   **Flujo de generación:** Para evitar pérdida de información, la acción de generar un archivo PDF de cotización disparará automáticamente el guardado de la oportunidad en el sistema. Una vez generada la cotización, los comerciales solo tendrán permisos para modificarla, no para eliminarla.
*   **Cambio de nomenclatura:** Se acordó renombrar el estado "Asignado" a **"No Ganada"** para evitar colisiones semánticas con asignaciones operativas de equipos o personal.
*   **Filtros de búsqueda:** Se planea agregar filtros de búsqueda por fecha, cliente y texto libre en la Torre de Control.
*   **Requerimientos de clientes:** Se añadirán campos específicos de facturación (región, ciudad/comuna y dirección de facturación) al formulario de creación de clientes.

### 2. Estructura de Servicios y Terminología
*   **Ajuste de Categorías:** Se cambiará el nombre de **"Familia de Servicio"** por **"Categoría"**. Se implementará un campo de **"Subcategoría"** dependiente de la categoría seleccionada (ej. si se selecciona "Grúa", solo se desplegarán subcategorías asociadas).
*   **Unidades de cobro y etiquetas:** 
    *   Renombrar **"Global"** a **"Fijo"**.
    *   Renombrar **"Viaje"** a **"Flete"**.
    *   Modificar el encabezado de la columna a **"Unidad de cobro"** para evitar confusiones en ventas.

### 3. Operaciones, Visitas a Terreno y Órdenes de Trabajo (OT)
*   **Gestión de visitas:** La responsabilidad de asignar equipos y personal técnico recaerá directamente en el coordinador de operaciones, no en el vendedor.
*   **Georreferenciación de obras:** Debido a la dificultad de usar el pin manual en el mapa, se integrará un **buscador/validador de direcciones** en el mapa dentro del módulo de cotizaciones. Se capturarán las coordenadas de geolocalización como datos generales del servicio.
*   **Flujo de OT:** El vendedor solicita la visita, enviando un correo automático a operaciones. El coordinador de operaciones asigna al técnico, el equipo y la hora de salida. Esto generará una Orden de Trabajo (OT) formal accesible desde la app móvil del especialista.
*   **Firma y verificación de documentos:** El proceso de firma de PDF mediante PIN genera un código QR de validación. Se agregará además un campo para firma manual del cliente con su Nombre y RUT.

### 4. Flota, Certificados e Integración de Datos
*   **Migración de flota:** Se migrarán los datos técnicos de equipos (marca, modelo, año, patente, dimensiones y tara/peso). Queda pendiente completar los valores de tara y largo (Jesús apoyará en la recopilación).
*   **Gestión documental:** Se migrarán documentos legales y certificados de equipos y personal desde Google Drive al sistema para habilitar alertas de vencimiento mediante calendario y paneles de control.
*   **Acceso a la plataforma:** Sergio proporcionará acceso vía Google Login a Jorge y al equipo para que comiencen las pruebas del flujo de tareas.

---

## 📋 Próximos Pasos (Derivados de la Reunión)

### 💻 Sergio Gajardo (Desarrollo y Configuración)
- [ ] **Configurar Notificaciones de Cotizaciones:** Implementar el envío automático de cotizaciones desde el sistema con copia automática predeterminada a los contactos pertinentes (Omar, Luis y Gisel).
- [ ] **Configurar Credenciales:** Configurar la autenticación bajo el dominio corporativo `Arriendo San Pablo` tras la creación de las credenciales de prueba.
- [ ] **Campos de Facturación:** Agregar los campos de Región, Ciudad/Comuna y Dirección de facturación al formulario de creación de clientes.
- [ ] **Buscador de Direcciones:** Integrar un buscador de direcciones en el mapa del módulo de cotizaciones para geolocalizar obras con precisión.
- [ ] **Importación de Flota:** Realizar la carga de los datos de flota desde la información técnica disponible en Drive.
- [ ] **Compartir Acceso Kanban:** Reenviar el enlace de acceso a la herramienta de gestión al equipo.
- [ ] **Ajustar Categorías:** Cambiar "Familia" por "Categoría" y vincular las subcategorías dependientes en el estructurador de servicios.
- [ ] **Ajustar Etiquetas de Cobro:** Reemplazar "Global" por "Fijo", "Viaje" por "Flete" y actualizar el encabezado de columna a "Unidad de cobro".
- [ ] **Captura de Geolocalización:** Incorporar la captura de coordenadas geográficas en los datos generales del servicio.
- [ ] **Firma de Cliente:** Añadir los campos de Nombre, Identificación (RUT) y firma manual al bloque de firmas de clientes.

### 🏢 Jorge Ponce (Operaciones y Gestión)
- [ ] **Creación de Manuales (Junto con Jesús):** Crear manuales y videos instructivos en la plataforma para guiar a los usuarios en los módulos del sistema.
- [ ] **Recopilación Técnica (Junto con Jesús):** Completar los datos pendientes de tara (peso) y largo de los equipos mediante revisión por patente.
- [ ] **Gestionar Accesos a Drive:** Compartir las carpetas de Drive de equipos y trabajadores con los colaboradores técnicos.
- [ ] **Solicitar Autorizaciones:** Solicitar a Dayana la autorización de acceso a las carpetas compartidas.
- [ ] **Enviar Notas Adicionales:** Remitir las observaciones y cambios pendientes del formulario de servicios por correo electrónico.

### 🔧 Jesús Acevedo (Apoyo Operativo y Datos)
- [ ] **Apoyar Carga de Datos:** Colaborar en la carga manual de equipos en caso de complicaciones con el proceso automatizado masivo.
