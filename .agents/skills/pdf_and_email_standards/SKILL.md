---
name: gsp_pdf_and_email_standards
description: Adaptador local de GSP para el despacho de correos B2B enriquecidos y la generación de documentos PDF con logos paramétricos, basándose en los estándares generales de producto LeanGlobal Platform.
---

# 📄 Adaptador GSP: Generación de PDFs y Envíos de Correos B2B

Este documento vincula los estándares del producto LeanGlobal con los parámetros específicos del proyecto **Grúas San Pablo (GSP)**.

> [!NOTE]
> Para la especificación técnica desacoplada del producto, consúltense:
> - **[`leanglobal_email_standards`](file:///D:/SGajardo/Google%20Drive/Antigravity/LeanGlobal%20-%20Product/.agents/skills/leanglobal_email_standards/SKILL.md)**
> - **[`leanglobal_pdf_standards`](file:///D:/SGajardo/Google%20Drive/Antigravity/LeanGlobal%20-%20Product/.agents/skills/leanglobal_pdf_standards/SKILL.md)**

---

## 1. ✉️ Despacho de Correos GSP (Nodemailer + Magic Links)

- **Servidor SMTP:** `powercp2.zglobalhost.com` (Puerto 465 SSL)
- **Cuenta Emisora:** `"GSP Platform" <notificaciones.gsp@leanglobal.cl>`
- **Endpoint:** `POST /api/message`
- **Generador de HTML:** `obtenerPlantillaHTML()` en `messageModel.js`.
- **Botón de Acción (Solicitud Visita a Terreno):**
  `https://sistema.leanglobal.cl/gsp/asignacion-visita?id_proyecto=${id_proyecto}&token=${token}`

---

## 2. 🖼️ Generación de PDFs GSP (Emisores & Logos Base64)

- **Empresas Emisoras (`tpar_empresas`):**
  - ID `9`: Grúas San Pablo (`logo-sanpablo.png`)
  - ID `7`: Bestmaq Arriendos (`logo-bestmaq.png`)
  - ID `8`: Logística del Sur (`logo-logistica.png`)
  - ID `11`: Royal Rental (`logo-royal.png`)
- **Directorio de Logos:** `/home/nodeadmin/proyectos/lean-services-gsp/public/`
- **Conversión Base64:** Obligatoria con `fs.readFileSync()` in-memory.
- **Compilador:** Binario `wkhtmltopdf` vía `xvfb-run`.
