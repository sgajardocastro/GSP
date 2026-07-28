---
name: gsp_pdf_and_email_standards
description: Estándar y guía técnica para la generación de documentos PDF con logos paramétricos y el despacho de correos B2B enriquecidos en LeanGlobal / GSP.
---

# 📄 Estándar Técnico: Generación de PDFs y Envíos de Correos B2B

## 1. 🏗️ Generación de Documentos PDF con Logos Paramétricos

Cuando se requiera generar un PDF oficial (cotizaciones, informes de visitas, OTs, actas):

### A. Consulta de Datos de la Empresa Emisora
1. Consultar la tabla `tpry_proyecto` para obtener `id_empresa` (o `id_empresa_emisora`).
2. Consultar `tpar_empresas` en PostgreSQL:
   ```sql
   SELECT id_empresa, name_empresa, razon_social, rut_empresa, giro, logo_empresa
   FROM tpar_empresas
   WHERE id_empresa = $1;
   ```

### B. Resolución Física de la Imagen del Logo (Opción 1 Estándar)
- Los archivos físicos de los logos (`logo-sanpablo.png`, `logo_gsp.png`, etc.) deben ubicarse en la carpeta estática del backend:
  `/home/nodeadmin/proyectos/lean-services-gsp/public/`
- El propietario de los archivos en el servidor Linux debe ser `nodeadmin:nodeadmin`.
- En el modelo backend Node.js (`proyectoModel.js`), leer la imagen y convertirla in-memory a **Base64 Data URI** antes de pasarla a la plantilla HTML de Puppeteer:
  ```javascript
  let finalLogoPath = emisor.logoPath;
  try {
    const logoFileName = emisor.logoPath || 'logo-sanpablo.png';
    const diskPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoFileName);
    if (fs.existsSync(diskPath)) {
      const imgBuf = fs.readFileSync(diskPath);
      finalLogoPath = 'data:image/png;base64,' + imgBuf.toString('base64');
    }
  } catch (err) {
    console.error('Error leyendo logo desde disco:', err);
  }
  ```
- **Nunca** utilizar rutas relativas `file:///var/www/html/...` que dependan de carpetas inexistentes.

---

## 2. ✉️ Despacho de Correos B2B Enriquecidos (`POST /message`)

Cuando se envíen correos comerciales o notificaciones formales hacia clientes o usuarios:

### A. Formato Obligatorio del Payload
En el backend de LeanGlobal (`messageModel.js`), el servidor mapea la propiedad `cuerpo` del JSON directamente al campo `html` de Nodemailer (`html: req.body.cuerpo`).

**Regla de Oro del Frontend / Llamador de API:**
- Se DEBE enviar la maqueta HTML comercial completa dentro del campo `cuerpo`:
  ```javascript
  await apiAxios.post('/message', {
    para: destinatariosCliente.join(', '),
    cc: destinatariosGSP.join(', '),
    asunto: 'Subject de la Notificación',
    cuerpo: htmlContent // <--- EL HTML COMPLETO SE ENVÍA EN "cuerpo"
  });
  ```
- **Jamás** enviar un string de texto plano dentro del parámetro `cuerpo` esperando que la propiedad `html` lo reemplace.

### B. Validación de Casillas de Destino
- Nunca dejar casillas ficticias o dominios inexistentes por defecto (`@cliente.cl`).
- Si la información del cliente no posee correo registrado, auto-cargar el correo del usuario operador en sesión (ej: `sgajardoc@gmail.com`) para prevenir rechazos en los registros MX de Exim.
