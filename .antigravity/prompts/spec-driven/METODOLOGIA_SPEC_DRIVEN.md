# 🏛️ CONSTITUCIÓN: METODOLOGÍA SPEC-DRIVEN (LEANGLOBAL)

**Misión:** Garantizar que la documentación técnica sea la Verdad Única (SSoT) y permita la reconstrucción total de los módulos sin ambigüedades. Esta metodología está diseñada con un orden jerárquico estricto y de baja ambigüedad, ideal para guiar el trabajo de analistas y desarrolladores paso a paso.

---

## 📌 1. PRINCIPIOS FUNDAMENTALES DE TRABAJO

Para mantener la claridad absoluta y facilitar el aprendizaje de nuevos integrantes del equipo (como Juanma), se establecen las siguientes reglas operacionales:

1. **Prohibición de la Síntesis:** Está terminantemente prohibido usar puntos suspensivos (`...`), resúmenes o comentarios de "relleno" en la documentación o código. Si un formulario tiene 50 campos, se listan los 50 campos de forma explícita.
2. **Grado de Restauración Total:** Una especificación es válida **SÓLO SI** permite a un desarrollador reconstruir la base de datos y la interfaz de usuario desde cero, basándose únicamente en lo escrito.
3. **Inmutabilidad del Formulario:** No se modifica la interfaz ni la lógica de base de datos sin actualizar y validar previamente el documento de especificación funcional.
4. **Instrucciones Basadas en Pasos:** Cada tarea debe dividirse en:
   * **Entradas (Inputs):** Qué datos o archivos se necesitan.
   * **Operación (Proceso):** Qué comandos o pasos exactos ejecutar.
   * **Resultado Esperado (Output):** Cómo verificar que el paso se completó con éxito.

---

## 📂 2. GESTIÓN DE REQUERIMIENTOS

El ciclo de vida de un requerimiento sigue una ruta lineal inalterable:

1. **Declaración en la SRS (Requerimiento de Software):** 
   * **Archivo:** `Gestión/especificacion_requerimientos_proyecto.md`.
   * **Acción:** Escribir con formato `RF-[Número] [Descripción del requerimiento y reglas de negocio]`.
2. **Clasificación en el Gap Analysis:**
   * **Archivo:** `Gestión/gap_analisis_proyecto.md`.
   * **Acción:** Clasificar el requerimiento en:
     * `[PRD]`: Funcionalidad ya existente en el core del producto LeanGlobal.
     * `[CONF]`: Requiere configuración en bases de datos o inyección de semillas (seeds).
     * `[DEV]`: Requiere desarrollo de código nuevo (endpoints backend, migración base de datos o lógica front).
3. **Creación de Tarea de Detalle (Checklist):**
   * **Archivo:** `Gestión/tareas.md`.
   * **Acción:** Registrar la tarea con un checkbox pendiente `[ ]`, asociando el ID del requerimiento de la SRS.

---

## 🌿 3. CONTROL DE VERSIONES Y GESTIÓN DE CAMBIOS

El desarrollo de código y documentación debe seguir el flujo estándar de Git:

1. **Ramas de Trabajo (Branches):**
   * `main`: Producción estable. Únicamente se modifica mediante fusiones aprobadas.
   * `dev`: Desarrollo activo y pruebas.
2. **Formato de Mensaje de Confirmación (Git Commit):**
   * Los mensajes de commit deben ser descriptivos y seguir la convención:
     * `feat(modulo): [descripción en minúsculas]` (ej: `feat(vialidad): agregar control de vigencia MOP`).
     * `fix(modulo): [descripción del error corregido]` (ej: `fix(telemetria): corregir delay de envío en ruta`).
3. **Control de Versiones (Bumping):**
   * En cada ciclo de compilación de producción, se debe incrementar manualmente o vía script el parche de versión en `package.json` (`1.0.0` -> `1.0.1`).

---

## 💾 4. PROTOCOLO DE RESPALDO Y COPIAS DE SEGURIDAD

Antes de realizar modificaciones mayores en bases de datos o código productivo, se debe ejecutar el siguiente protocolo:

### A. Respaldos Locales de Seguridad
1. **Acción:** Copiar la carpeta local de trabajo a un directorio externo de respaldo.
2. **Nomenclatura de Carpeta:** `[nombre-proyecto]_backup_YYYYMMDD_HHMMSS` (ej: `terracon-pwa_backup_20260525_003144`).

### B. Respaldos Remotos Automatizados
1. **Acción:** En cada proceso de despliegue, el script de compilación conectará vía SSH con el servidor (`servidor.leanglobal.cl`) y creará un archivo comprimido `.tar.gz` del directorio remoto actual en `/var/www/html/backups/`.
2. **Comando Automatizado (Script MJS):**
   ```javascript
   const backupName = `proyecto-${env}-backup-$(date +%Y%m%d_%H%M%S).tar.gz`;
   await ssh.execCommand(`tar -czf /var/www/html/backups/${backupName} -C /var/www/html proyecto-directorio`);
   ```
3. **Resultado Esperado:** Archivo `.tar.gz` verificado en la carpeta de respaldos remota antes de sobreescribir cualquier archivo en producción.

---

## 🚀 5. PROCEDIMIENTO DE DESPLIEGUE (DEPLOY)

Para subir cambios al servidor de producción/desarrollo de manera segura, se debe ejecutar estrictamente la siguiente secuencia de pasos:

1. **Paso 1: Incrementar Versión:** Abrir `package.json` y actualizar la versión (ej: `version: "1.0.4"`).
2. **Paso 2: Conmutar Variables de Entorno (switch-env):** Ejecutar el script que activa la URL del backend correspondiente (ej. `node switch-env.mjs dev` o `qa`).
3. **Paso 3: Compilación Local:** Ejecutar `npm run build` en la terminal.
   * *Verificación:* Asegurarse de que el directorio `dist/` se generó sin errores en la terminal.
4. **Paso 4: Ejecutar Respaldo Remoto:** Iniciar el script de deploy que crea la copia de seguridad `.tar.gz` en el servidor SSH.
5. **Paso 5: Limpieza de Servidor:** Ejecutar comando SSH de borrado del contenido antiguo en el directorio de destino del servidor (`rm -rf /var/www/html/[proyecto]/*`).
6. **Paso 6: Carga de Archivos (Upload):** Transferir el directorio local `dist/` al servidor utilizando SSH SFTP.
7. **Paso 7: Verificación Online:** Cargar la URL de la aplicación en el navegador y comprobar en la consola que no haya errores de carga y que se visualice el número de versión nuevo.

---

## 🧪 6. PROTOCOLO DE PRUEBAS Y CONTROL DE CALIDAD (QA)

Toda entrega de código, maqueta o propuesta debe pasar obligatoriamente por este checklist antes de considerarse lista:

### A. Pruebas de Integridad HTML/DOM
* **Regla:** Es mandatorio comprobar el correcto balance de etiquetas (`<div>`, `<section>`, `<form>`). El descuido de un solo tag de cierre se considera una falla crítica.
* **Verificación:** Ejecutar formateo de código con herramientas integradas y comprobar que la indentación visual sea perfecta.

### B. Pruebas de Funcionamiento y Consola (QA Local)
1. Levantar el entorno local (`npm run dev`).
2. Abrir herramientas de desarrollador (`F12`) en la pestaña **Console**.
3. Navegar por todas las pantallas del módulo modificado.
   * *Resultado Esperado:* **Cero** errores tipo `ReferenceError`, `TypeError` o `SyntaxError`.
4. Si la funcionalidad soporta modo offline, simular desconexión (pestaña Network -> Offline) y verificar que los datos se guarden en la base de datos del navegador (`IndexedDB`) y se visualice la alerta de "Operación sin Red".

### C. Prueba de Persistencia de Identificadores (IDs)
* **Regla:** Cada registro de formulario o checklist debe retornar y almacenar su UUID o ID único correlativo provisto por el backend para evitar la duplicación de datos al reconectar o reintentar el guardado.
* **Verificación:** Comprobar el log de la red (`Network`) y la respuesta JSON del servidor al presionar el botón "Guardar".

---
**RECUERDA:** Un resumen es un error. Un detalle omitido es un fallo de seguridad. La especificación ES el producto. Graba estas reglas en tu rutina de desarrollo diario.
