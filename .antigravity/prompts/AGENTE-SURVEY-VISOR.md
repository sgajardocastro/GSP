# Estándar de Desarrollo y Reglas de Arquitectura - Grúas San Pablo (GSP)

## 1. Visor de Survey e Inspecciones (`verSurveyPrint.vue` / `VerSurveyModal.vue`)
- **Petición Aislada de Detalle:** En llamadas a `procesosSurveyDetail`, NUNCA inyectar parámetros de filtro global como `_id_empresa`. Solo enviar `id_survey`.
- **Renderizado Visual de Firmas:** Las firmas digitales y trazos deben renderizarse obligatoriamente como elemento de imagen `<img :src="resolveImgSrc(...)">` usando `isImageDoc()` y la URL resuelta por `resolveImgSrc()`.
- **Aislamiento z-index Modal:** El contenedor de `VerSurveyModal.vue` debe tener `z-index: 99999 !important` para que ningún control de mapa o buscador quede por encima del visor.

## 2. Firma Electrónica y Canvas en PWA (`FirmaDialog.vue` / `SignatureField.vue`)
- **Fondo de Canvas:** El lienzo de firma digital en PWA debe tener fondo blanco nítido `#ffffff` con tinta azul noche `#0f172a` y trazo de `3px`.
- **Firma en PWA:** El modal `FirmaDialog.vue` incluye el componente `SignatureField` para visualización y captura directa antes de ingresar la contraseña FES.
- **Último Firmante (`flag_flow_fin === true`):** El último firmante del flujo siempre preserva su decisión original (`APRUEBA` / `RECHAZA`) sin forzar a `CON_OBSERVACIONES`.
