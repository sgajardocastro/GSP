# Ficha de Caso de Soporte: CASO-20261107-01

## 1. Identificación del Incidente
- **Código:** CASO-20261107-01
- **Fecha:** 2026-11-07
- **Proyecto Involucrado:** `RYL-2611-00001` (`id_proyecto = 48`, Obra Salfa Recabarren - Cliente: Montajes, Obras Menores, Transportes Claudia Fernanda Gutiérrez / Royal)
- **Usuario Afectado / Reportante:** Jorge Ponce / Sergio Gajardo / Franz Sandoval (Cliente Arrendatario)
- **Equipo Involucrado:** Plataforma Articulada Diesel XCMG (PAD-31)
- **Ambiente:** Producción (`PROD`)
- **Severidad:** Crítica (Bloqueo de firma electrónica y legalización comercial de contrato de arriendo)
- **Estado:** RESUELTO

---

## 2. Síntoma Reportado
Al acceder al enlace público enviado por WhatsApp/Email al cliente para la firma del contrato:
`https://servidor.leanglobal.cl/lg-gsp-prod/firmar-contrato?token=b42e808393c52a3abf1928af599e1155dc670c2aa35c3ee0`

La plataforma mostraba una tarjeta roja de error con el mensaje:
> *"Enlace no disponible"*
> *"Token de firma inválido o inexistente"*
> *"Si necesitas un nuevo enlace de firma, contacta al ejecutivo comercial a cargo."*

El cliente no podía revisar las 14 cláusulas ni proceder con el estampado de la firma digital FES.

---

## 3. Causa Raíz Técnica
1. **Desfase en la Estructura de Persistencia del Token en Base de Datos:**
   En el CRM (`GestorOportunidades.vue`), al generar y despachar el contrato o guardar la oportunidad, el objeto `contratoData` registraba el token como `token_publico: data.token` y `url_publica_firma: data.url_firma`.
2. **Filtro SQL Rígido en Backend (`proyectosController.js`):**
   Tanto en `obtenerContratoPorToken` (línea 766) como en `firmarContratoPublico` (línea 856), la consulta SQL buscaba estrictamente:
   ```sql
   WHERE p.json_field->'crm_v1'->'contrato'->'token_firma'->>'token' = $1
   ```
   Al persistirse como `"token_publico": "b42e8083..."`, la consulta retornaba 0 filas, gatillando error `HTTP 404 Not Found`.

---

## 4. Solución Aplicada
1. **Backend (`proyectosController.js`):**
   - Se flexibilizaron las consultas SQL en `obtenerContratoPorToken` y `firmarContratoPublico` para buscar tanto en `token_firma->>'token'` como en `token_publico`.
   - Se añadió resolución resiliente de `tokenInfo` para contratos con estructura plana.
   - Al estampar la firma digital, el backend asegura la actualización tanto de `token_firma` como de `token_publico` y marca el estado en `FIRMADO_DIGITAL`.
2. **Regularización en Base de Datos de Producción (`sch_leangsp_prod`):**
   - Se ejecutó update para el proyecto 48 en `sch_leangsp_prod.tpry_proyecto`, sincronizando el subobjeto `token_firma` con vigencia activa por 30 días.
3. **Despliegue y Validación:**
   - Controladores actualizados en PROD (`lean-services-gsp-prod`) y DEV (`lean-services-gsp`).
   - PM2 recargado sin caída de servicio (reloads limpios en instancias 13 y 10).

---

## 5. Archivos Intervenidos
- `ejecucion/backend_remoto/src/controllers/proyectosController.js`
- Servidor Remoto:
  - `/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/proyectosController.js`
  - `/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/proyectosController.js`
- Base de Datos: `sch_leangsp_prod.tpry_proyecto` (`id_proyecto = 48`)

---

## 6. Verificación y Resultados
- Consulta al endpoint `/api/proyectos/contrato/public/b42e808393c52a3abf1928af599e1155dc670c2aa35c3ee0` responde **HTTP 200 OK**.
- El payload retorna la metadata completa del proyecto 48, datos del mandante (*Montajes, Obras Menores, Transportes Claudia Fernanda Gutiérrez*), representante (*Franz Sandoval*), y el HTML completo de las 2 páginas del contrato con cláusulas, tarifas y canvas de firma.
- El cliente puede abrir el enlace en su navegador móvil o de escritorio y firmar inmediatamente.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Las claves y tokens públicos compartidos hacia el exterior (WhatsApp, Email) deben contar con soporte dual de lectura (coalescencia de esquema `token_publico` y `token_firma->token`) para tolerar mutaciones de esquema entre módulos Frontend y CRM.
