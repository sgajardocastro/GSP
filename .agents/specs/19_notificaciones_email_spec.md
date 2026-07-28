# 📑 Especificación Técnica: Envío de Cotización por Email y Control de Versiones

- **Módulo:** CRM / Gestor de Oportunidades & Cotizaciones
- **Componente:** `GestorOportunidades.vue` / `ModalEnviarCotizacion.vue`
- **Fecha:** 2026-07-27
- **Versión:** 1.0

---

## 1. Resumen de Requerimientos

Esta especificación norma el ciclo de generación, envío de correos electrónicos y registro de bitácora para cotizaciones comerciales en la plataforma Grúas San Pablo (GSP).

---

## 2. Ajustes en la Interfaz de Cotización (`GestorOportunidades.vue`)

### 2.1. Renombrado de Botón Principal de Generación
- El botón con el texto `"Generar PDF"` cambia oficialmente a **`"Generar Cotización"`**.
- Al presionar este botón, se genera el documento PDF numerado y se agrega al listado de **Control de Versiones**.

### 2.2. Panel "Control de Versiones"
- **Orden de Despliegue:** La lista de versiones se despliega ordenada cronológicamente de forma descendente, dejando **siempre la versión más reciente en el primer lugar**.
- **Botón PDF Icónico Rojo:** Cada registro en el listado de versiones incluye un botón con icono de documento estilizado en **color rojo icónico PDF** (`bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20`), que permite previsualizar o descargar el PDF generado.
- **Acción "Enviar Cotización":** Exclusivamente al lado del registro de la **última versión de cotización generada**, se despliega el botón **`"Enviar Cotización"`**.

---

## 3. Diálogo Modal de Envío (`ModalEnviarCotizacion.vue`)

Al presionar el botón `"Enviar Cotización"`, se abre el diálogo flotante con una grilla de **2 Columnas en la parte superior y Script Comercial a Ancho Completo en la parte inferior**:

### 3.1. Distribución del Formulario Modal (Layout UX)
1. **Encabezado y Remitente Emisor:**
   - Campo fijo solo lectura: `notificaciones.gsp@leanglobal.cl`.
2. **Grilla Superior (2 Columnas):**
   - **Columna Izquierda (Destinatarios Cliente):**
     - Pre-carga automática del correo del contacto principal del cliente.
     - Input dinámico para agregar destinatarios adicionales y grilla de etiquetas removibles.
   - **Columna Derecha (Copia Interna Equipo GSP):**
     - Carga reactiva de los **usuarios enrolados reales en el sistema** (obtenidos vía API `/servicio/leanglobal/obtenerUsuarios` o la tabla de usuarios activos).
     - *(Nota: Se filtrará automáticamente por el rol `COMER` cuando la gestión RBAC esté en fase avanzada)*.
3. **Sección Inferior a Ancho Completo (Script Comercial Editable):**
   - **Asunto Predeterminado (Editable):** `Cotización Grúas San Pablo: [CODIGO_PROYECTO] - [NOMBRE_CLIENTE]`.
   - **Cuerpo del Mensaje (Editable):** Textarea amplio de `rows="6"` con el script comercial estándar pre-cargado:
     > *"Estimado(a) [NOMBRE_CONTACTO],\n\nJunto con saludar, adjuntamos la propuesta cotización oficial [CODIGO_VERSION] correspondiente al servicio solicitado para la obra [NOMBRE_OBRA].\n\nQuedamos atentos a sus comentarios para coordinar los detalles operativos.\n\nSaludos cordiales,\nEquipo Comercial — Grúas San Pablo"*

---

## 4. Persistencia en Base de Datos PostgreSQL (`tpry_proyecto.json_field`)

Para asegurar la trazabilidad permanente y evitar la creación no deseada de versiones adicionales al enviar un correo, la persistencia se especifica bajo la siguiente estructura JSON en la base de datos:

### 4.1. Esquema JSON de Versiones (`crm_v1.cotizaciones_historicas`)
- Al presionar **"Enviar Cotización"**, el objeto de auditoría `evento_envio` se graba indisolublemente dentro del elemento correspondiente en el arreglo `json_field.crm_v1.cotizaciones_historicas` en la tabla `tpry_proyecto`:

```json
{
  "json_field": {
    "crm_v1": {
      "cotizaciones_historicas": [
        {
          "id_cotizacion": 43,
          "version": 8,
          "version_codigo": "v8",
          "monto": 700000,
          "fecha": "2026-07-27T22:55:56.000Z",
          "url": "/lg-gsp/api/archivo/cotizaciones/GSP-2607-557-004V8-43.pdf",
          "evento_envio": {
            "fecha_envio": "2026-07-27T22:57:38.000Z",
            "usuario_envio": "Sergio Gajardo",
            "destinatarios_cliente": ["contacto@cliente.cl"],
            "destinatarios_cc": ["sgajardoc@gmail.com"]
          }
        }
      ]
    }
  }
}
```

### 4.2. Reglas Duras de Persistencia
1. **Sin Duplicación de Versiones:** La acción de envío **NO debe crear una nueva versión** en el arreglo `cotizaciones_historicas` (no altera el contador de versiones ni crea registros \$0).
2. **Inmutabilidad de Registro:** Una vez guardado `evento_envio`, este se renderiza de forma persistente en la UI cada vez que la oportunidad sea consultada o reabierta desde cualquier dispositivo.

---

## 5. Servicio Backend de Despacho Físico SMTP (`emailService.js`)

Para asegurar que los correos electrónicos sean efectivamente despachados y recibidos en las bandejas de entrada de los clientes y equipo GSP, se especifica la siguiente infraestructura de transporte SMTP:

### 5.1. Parámetros de Conexión SMTP
- **Host SMTP:** `smtp.leanglobal.cl` / `mail.leanglobal.cl`
- **Puerto:** `465` (SSL/TLS) o `587` (STARTTLS)
- **Autenticación (AUTH):**
  - `user`: `notificaciones.gsp@leanglobal.cl`
  - `pass`: `${process.env.SMTP_GSP_PASS}`
- **Remitente Encabezado `From`:** `"Grúas San Pablo Operaciones" <notificaciones.gsp@leanglobal.cl>`

### 5.2. Despacho Físico mediante Nodemailer
El controlador de despacho (`emailService.js`) ejecutará las siguientes acciones en cada invocación:
1. **Destinatarios (`To`):** Lista de correos del cliente en formato separado por comas.
2. **Copia Interna (`Cc`):** Lista de correos de usuarios enrolados GSP seleccionados.
3. **Cuerpo HTML Corporativo:** HTML responsivo estilizado con cabecera Amber/Slate GSP, código de proyecto y script comercial editado por el usuario.
4. **Adjunto PDF (`Attachments`):** Inyección del archivo PDF binario de la cotización (`url` almacenada en la versión).

```javascript
// Ejemplo de especificación de transporte Nodemailer
const info = await transporter.sendMail({
  from: '"Grúas San Pablo" <notificaciones.gsp@leanglobal.cl>',
  to: payload.destinatarios.join(', '),
  cc: payload.copia_interna.join(', '),
  subject: payload.asunto,
  html: renderHtmlTemplate(payload),
  attachments: [
    {
      filename: `${payload.version_codigo}.pdf`,
      path: pdfPathOnServer
    }
  ]
});
```
