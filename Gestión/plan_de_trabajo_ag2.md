# Plan de Trabajo para Antigravity 2.0 - Gestión Operación Grúas San Pablo

Este documento contiene las especificaciones técnicas y requerimientos de negocio extraídos de la reunión de análisis y refinados con las observaciones del equipo, estructurados para ser ejecutados por Antigravity 2.0.

## 1. Gestión de Roles y Permisos (RBAC)
- **Roles Requeridos**:
  - `Gerencia`: Visibilidad total (global) de todos los negocios, pero en modo **solo lectura** (sin capacidad de edición).
  - `Administrador`: Acceso total.
  - `Ejecutivo_comercial_[sucursal]`: Vendedor. Solo puede visualizar y editar su propia cartera de clientes y cotizaciones. (Ej: `ejecutivo_comercial_temuco`, `ejecutivo_comercial_puerto_montt`).
- **Regla de Negocio**: No habrá restricciones por empresa; cualquier persona puede trabajar con cualquier cliente, el filtro de visibilidad es estrictamente por el propietario (vendedor) del negocio.

## 2. Módulo de Clientes y Contactos
- **Campos Obligatorios Nuevos**: En el registro de cliente, hacer obligatorios: Dirección, Ciudad, Región y Comuna.
- **Puntos de Contacto**:
  - Habilitar la funcionalidad para **agregar nuevos contactos** asociados a un cliente (un cliente puede tener múltiples puntos de contacto).
  - Campos por contacto:
    - **Nombre del contacto**
    - **Correo electrónico**
    - **Teléfono del contacto**
    - **Observaciones** (Ej: "no llamar el fin de semana").
  - **Selección de Contacto**: En la creación y edición de cotizaciones/preventa, el usuario podrá **seleccionar el contacto específico** desde una lista desplegable que muestre todos los puntos de contacto guardados de ese cliente.

## 3. Módulo de Preventa y Cotizaciones
- **Estructurador de Servicios**: Agregar la categoría **"Accesorios"** (para incluir elementos como canastillos). Mantener el resto de las categorías de recopilación.
- **Categorías y Subcategorías de Equipos**: *(Pendiente)* La estructura definitiva de categorías y subcategorías de equipos está pendiente de entrega por parte de GSP (mediante archivo Excel para la carga limpia en sistema).
- **Acreditaciones (Etapa Temprana)**: En la creación de la cotización, incluir únicamente un checkbox/flag simple de **"REQUIERE ACREDITACIÓN"**. (No incluir la lista desplegable múltiple para no saturar al vendedor).
- **Emisor de Correos**: Mientras no se resuelva el uso del dominio oficial de GSP, se continuará trabajando con la casilla de correo actual en uso para el envío de cotizaciones.
- **Firma de Cotización**: Por ahora, la cotización final **NO** llevará FES (Firma Electrónica Simple).
- **Lista de Acreditaciones (Etapa Ganada)**: Al ganar la cotización, habilitar y hacer obligatoria una lista desplegable de selección múltiple con los requerimientos de acreditación de prevención.

## 4. Módulo de Visita a Terreno
- **Template y Flujo de Solicitud (`Solicitud_Visita_Terreno`)**: 
  - Generar un template con lógica de renderizado en la PWA denominado **`Solicitud_Visita_Terreno`**.
  - El **Vendedor/Usuario Comercial** genera esta solicitud/survey desde la interfaz web (ingresando fecha solicitada, horario, cliente y observaciones).
  - El **Coordinador de Operaciones** recibe la solicitud y planifica una inspección de "Visita a Terreno" indicando: Cliente, dirección y ubicación geográfica (**Latitud/Longitud** si está disponible), asignando la tarea a un ejecutor específico para una fecha determinada.
- **Corrección de Template**: Evitar que se envíe el `.json` del estructurador de servicios en la plantilla actual de visita a terreno.
- **App Móvil (Terreno)**:
  - Asegurar captura de Geolocalización en los formularios.
  - Habilitar captura de Firma Digital (Nombre, RUT y trazado de firma) del cliente.

## 5. Módulo de Operaciones y Validación (Coordinación)
- **Aparejos y Elementos de Izaje**:
  - Tomar como referencia el catálogo completo de elementos de izaje y aparejos disponibles en el template de Visita a Terreno (desplegar todos los ítems disponibles, aunque estén vacíos).
  - Los aparejos que tengan algún valor registrado durante la visita a terreno se desplegarán prellenados como valor por defecto (*default*).
  - El Coordinador tendrá a mano todo el catálogo para agregar o completar manualmente los valores de aquellos aparejos que no hayan sido registrados en la visita a terreno.
- **Asignación de Equipos de Apoyo**:
  - El Coordinador puede agregar *solo*: Vehículos livianos (camionetas/furgones), vehículos de apoyo, accesorios y personal.
  - **Restricción Grúas**: El Coordinador **NO** puede agregar grúas ni maquinaria principal extra. Solo está autorizado a **cambiarlas** por una máquina equivalente del mismo tipo (para cuadrar costos).
- **Validación de Certificados de Flota**: Al asignar equipos, el sistema debe leer los certificados vigentes. Si un certificado está próximo a vencer, mostrar una advertencia visual (indicador amarillo).
- **Marcadores de Diferencia (Diffs)**:
  - En la etapa de *Validación y Diff* (aprobación de operaciones), **activar** los marcadores de diferencia (texto tachado en rojo).
  - Esto aplica a cualquier cambio realizado por el coordinador sobre textos, combos o datos arrastrados de la cotización original. (Nota: Estos marcadores deben estar *apagados* durante la etapa de preparación inicial).

## 6. Módulo de Inspecciones y Preparación Final
- **Control de Calidad e Inspección de Patio**:
  - Incluir en el flujo del Coordinador la notificación de Control de Calidad.
  - El Coordinador debe poder programar y asignar la "Inspección de patio" al Jefe de Patio.
  - El sistema debe visualizar el estado de la inspección (Verde = Finalizado, Rojo = Rechazado/Falla condición).
- **Finalización de Preparación**: Agregar un checkbox de tareas obligatorias que el Analista de Operaciones debe marcar para dar por finalizada la preparación comercial.

## 7. Eventos de Notificación y Correos Automáticos
- **Corrección Bug**: Arreglar el error tipográfico en el dominio del correo de prueba (quitar la doble "s" en arriendos).
- **Copias Obligatorias Centralizadas**:
  Se deben emitir correos con copia obligatoria (indelebles por el vendedor) a: Gerencia (Luis y Omar obligatoriamente), Vendedor, Analista de Operaciones y Coordinador de Operaciones, en los siguientes eventos gatilladores:
  1. Al registrar la cotización como **Ganada**.
  2. Al confirmar el requerimiento con observaciones (**Diff de operador**) en el área de operaciones.
