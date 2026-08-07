# ✍ Especificación de Formulario: Captura de Firma FES Cliente

Este documento define la estructura de datos, lógica de control, validaciones y protocolo de persistencia para el formulario **Captura de Firma FES Cliente** en la App del Operador.

---

## 1. MODELO DE DATOS REACTIVO LITERAL
```javascript
const fesClienteData = {
  id: "FES-20260621-SRV041", // Formato: FES-YYYYMMDD-[ServiceNumber]
  serviceId: "#SRV-2026-041",
  clientName: "Andrés Molina Bravo",
  clientRut: "15.684.922-K",
  clientRole: "Supervisor Faena CMPC",
  clientFeedback: "Servicio completado conforme a plan de rigging autorizado. Maniobra limpia.",
  signatureImage: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  timestamp: "2026-06-21T18:30:00Z"
};
```

---

## 2. PROTOCOLO DE PERSISTENCIA
- **Prefijo de ID:** `FES-`
- **Destino en LocalStorage:** `gsp_buffered_fes`
- **Endpoint del API:** `POST /api/operator/fes-signature`
- **Efecto de Sincronización:** Al guardarse esta firma, el servicio en la base de datos cambia su estado de `EN_MANIOBRA` a `COMPLETADO`, y el EDP correspondiente en el panel de despacho se actualiza a `Borrador Generado`.

---

## 3. REGLAS DE UI/UX Y VALIDACIÓN
- **Firma Obligatoria:** El lienzo de firma (HTML5 Canvas) no puede estar en blanco. Se debe validar que contenga trazos pintados antes de permitir el envío.
- **RUT Chileno:** El Rut del receptor del servicio debe pasar por validación de dígito verificador estándar antes de habilitar el botón de envío.

---

## 4. RENDERIZADO DE EXPORTACIÓN PDF (PUPPETEER)
- **Bug de Miniatura (Thumbnail Bug):** En versiones previas, la firma FES se renderizaba como una imagen minúscula distorsionada al exportar el Survey a PDF.
- **Solución Arquitectónica:** El bloque de la firma `signature` DEBE ser extraído de cualquier esquema tabular o grilla de SurveyJS. Debe inyectarse como un contenedor `div` bloque (100% width) en el DOM final antes de que Puppeteer capture la página.
- **Helper de Renderizado:** Se debe utilizar un helper CSS forzado (`page-break-inside: avoid;`) sobre el contenedor de la firma para asegurar que el canvas no se corte entre dos páginas del PDF final.
