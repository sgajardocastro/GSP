# CASO-20261022-01 — Pantalla en Negro al Editar `ITS-2086` en Estado `PENDIENTE_VERIFICACION` (ITS Transición)

---

## 1. Ficha del Incidente

| Campo | Detalle |
| :--- | :--- |
| **ID del Caso** | `CASO-20261022-01` |
| **Fecha / Hora** | `2026-10-22 12:10 CL` (Resolución: `2026-10-22 12:32 CL`) |
| **Usuarias Involucradas** | **Yiara Mendoza** (Analista de Operaciones, reporta el incidente) y **Karen Carrasco** (`id_user = 15`, Secretaria de Operaciones, firmante FES de elaboración) |
| **Negocio / Cotización** | Cotización `#2086` — Folio `ITS-2086` (`id_transicion = 46`, Cliente: `ASTILLERO PANITAO SPA`, OTs: `64976, 64977, 64978`, 3 jornadas) |
| **Equipos Involucrados** | `VSFK11` + 2° equipo asignado en `ITS-2086` |
| **Ambiente** | Producción (`PROD` — `sch_leangsp_prod`) y Desarrollo (`DEV` — `sch_leangsp`) |
| **Severidad** | **Alta** (Caída completa del árbol de renderizado de `ItsTransicionView.vue` al abrir cualquier ITS firmado con FES) |
| **Estado** | `RESUELTO Y DESPLEGADO EN PROD Y DEV` |

---

## 2. Síntoma Reportado por Terreno

Reporte textual enviado por **Yiara Mendoza**:
> *"Hola Sergio como esta? Cuando tenga un momento me ayuda con esto por favor, ITS transición. La secretaria lo firmo y quedo tomado en pendiente de verificación, cuando intento ingresar para editarlo la pantalla se va a negro.."*

En la captura adjunta se observa la fila de la Matriz de Conciliación de `ItsTransicionView.vue`:
- **Cotización:** `#2086`
- **Cliente:** `ASTILLERO PANITAO SPA`
- **OTs / Jornadas:** `64976, 64977, 64978 (3 jor.)`
- **Equipos:** `VSFK11, OTRA`
- **Estado ITS:** `ITS-2086 (PENDIENTE_VERIFICACION)` — `👤 Karen Carrasco`
- **Acción presionada:** Botón **`✏️ Continuar`**

---

## 3. Diagnóstico Técnico & Evidencia Empírica

### 3.1. Registro en Base de Datos (`sch_leangsp_prod.tits_transicion_historial`)
Al consultar el registro `id_transicion = 46` (`folio_its = 'ITS-2086'`, `numero_cotizacion = '2086'`) en `sch_leangsp_prod`:

```json
{
  "id_transicion": 46,
  "folio_its": "ITS-2086",
  "numero_cotizacion": "2086",
  "version": 1,
  "cliente_nombre": "ASTILLERO PANITAO SPA",
  "estado": "PENDIENTE_VERIFICACION",
  "firmas_fes": {
    "elaborador": {
      "ip": "::ffff:127.0.0.1",
      "rol": "USR-CONSENT",
      "rut": "176296011",
      "cargo": "Secretaria de Operaciones",
      "nombre": "Karen  Carrasco",
      "timestamp": "2026-10-13T21:33:07.246Z",
      "codigo_fes": "FES-GSP-ELAB-F033B933",
      "id_usuario": 15
    }
  },
  "id_usuario_elaborador": 15,
  "eq_type": "array",
  "jor_type": "array",
  "eq_len": 2,
  "jor_len": 3
}
```

### 3.2. Inspección del Componente Frontend (`ItsTransicionView.vue`)
Al trazar la función `cargarInformeParaEdicion(s.itsRelacionado)` invocada por el botón **`✏️ Continuar`** en [`ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue#L3810-L3845):
- Cuando el informe está en `BORRADOR`, `informe.firmas_fes?.elaborador` es `undefined`, por lo que el bloque `v-if="informe.firmas_fes?.elaborador"` (línea 1376) no se evalúa.
- En cuanto Karen Carrasco firmó con FES, `informe.firmas_fes.elaborador` quedó poblado con su objeto de firma y `timestamp`.
- Al cargar `ITS-2086` en el formulario, Vue entra al `v-if="informe.firmas_fes?.elaborador"` y evalúa la línea 1380:
  ```html
  <p class="text-[8px] text-slate-500">{{ formatDateCL(informe.firmas_fes.elaborador.timestamp) }}</p>
  ```
- En `<script setup>` (línea 2251) existía únicamente `formatDateCLHora`, mientras que **`formatDateCL` no estaba definida**, disparando un `TypeError: $setup.formatDateCL is not a function` no capturado durante el render de Vue 3 que desmontaba toda la vista dejando el fondo oscuro (`#050810`, pantalla en negro).

---

## 4. Causa Raíz de Arquitectura (Software / State Machine / Datos)

1. **Función `formatDateCL` referenciada en template y generador PDF pero omitida en `<script setup>`:**
   - Invocada en 9 puntos de [`ItsTransicionView.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue) (líneas `132, 1380, 1403, 1426, 1448, 4638, 4654, 4670, 4681`) para sellos FES (`elaborador`, `verificador`, `aprobador`) e historial de observaciones.
2. **Sobreescritura de estado en `guardarBorradorLocal()`:**
   - El botón **`💾 Guardar Cambios`** en estados `PENDIENTE_VERIFICACION` y `PENDIENTE_CONTABILIDAD` invocaba `guardarBorradorLocal()`, que forzaba el estado de vuelta a `'BORRADOR'` en lugar de conservar el estado de revisión vigente.

---

## 5. Plan de Mitigación y Resolución

### 5.1. Corrección en [`ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue`](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue)
1. Se definió `const formatDateCL = (isoStr) => formatDateCLHora(isoStr)` en `<script setup>` (línea 2267).
2. Se actualizó `guardarBorradorLocal()` (línea 3564) para preservar `informe.estado` cuando se encuentra en `PENDIENTE_VERIFICACION` o `PENDIENTE_CONTABILIDAD`.
3. Se blindó `cargarInformeParaEdicion()` (líneas 3821–3842) inicializando de forma defensiva todos los arreglos (`equipos`, `jornadas`, categorías de `costos`) y mapas de override.

### 5.2. Compilación y Despliegue en DEV y PROD
- Compilado `dist_dev` (`index--Rwu-zfu.js`) y `dist_prod` (`index-3Ki8dJjb.js`) con 0 errores.
- Desplegado en `/var/www/html/lg-gsp-dev` y `/var/www/html/lg-gsp-prod`, eliminando todos los bundles `index-*.js` / `index-*.css` antiguos.
- Verificado con `HTTP 200 OK` en `https://servidor.leanglobal.cl/lg-gsp-prod/`.

---

## 6. Protocolo de Respuesta y Guía al Usuario

> *"Hola Yiara, ya quedó corregido y actualizado en Producción. Por favor recarga la página con `Ctrl + F5` (o cierra y vuelve a abrir la pestaña) e ingresa nuevamente con el botón **Continuar** al `ITS-2086` (`ASTILLERO PANITAO SPA`). Ahora abrirá normalmente con el sello FES de Karen Carrasco visible y podrás editar y guardar los cambios sin que cambie su estado de verificación."*

---

## 7. Lecciones Aprendidas y Acciones Preventivas

1. **Verificación de Helpers de Formato en Bloques Condicionales (`v-if`):** Los bloques condicionales que dependen de estados posteriores del flujo (como `v-if="informe.firmas_fes?.elaborador"` o `v-if="esObservado"`) deben verificarse con datos firmados reales para asegurar que ningún helper referenciado en template falte en `<script setup>`.
2. **Preservación de Estado al Guardar Cambios en Etapa de Revisión:** Cuando un analista o administrador edita un ITS que ya está en `PENDIENTE_VERIFICACION` o `PENDIENTE_CONTABILIDAD`, la acción `Guardar Cambios` debe persistir la data manteniendo el estado actual del flujo.
