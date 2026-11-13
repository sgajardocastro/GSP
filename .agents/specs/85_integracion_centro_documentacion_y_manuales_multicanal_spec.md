# SPEC-085: Integración Multicanal del Centro de Documentación y Manuales Oficiales (Web CRM, PWA Operador y Hoja de Ruta Móvil)

## 📌 Contexto & Motivación
El ecosistema de Grúas San Pablo (GSP) cuenta con un catálogo exhaustivo de 15 manuales, guías interactivas, planos maestros y simuladores desarrollados en HTML/Tailwind en `ejecucion/frontend/public/`. 

Entre ellos destacan el **Centro de Documentación del Sistema** (`centro_documentacion_gsp.html`, portal maestro con filtros y buscador reactivo) y el **Manual del Operador en Terreno** (`manual_operador_terreno_gsp.html`), el cual fue recientemente actualizado con la matriz oficial de 5 columnas para capturas de horómetros, odómetros y combustible en viajes y reports diarios.

Para garantizar que esta documentación sea accesible de forma intuitiva tanto para las jefaturas en el CRM de escritorio como para los operadores y choferes en sus dispositivos móviles en faena, se requiere una integración multicanal consistente.

---

## 🎯 Objetivos de Negocio y Operacionales
1. **Acceso Centralizado en Web CRM:** Disponer de un menú de primer nivel en el Sidebar (`Sidebar.vue`) que permita a administradores, planificadores y jefaturas acceder a los 15 manuales del sistema sin salir del entorno de trabajo, con accesos directos a los 5 manuales de mayor recurrencia.
2. **Acceso Inmediato en PWA Operador:** Permitir que los choferes y operadores en terreno consulten el *Manual del Operador en Terreno* y el *Manual de Plataformas 360°* desde el menú de perfil de la PWA (`App.vue`) en cualquier momento de su turno.
3. **Asistencia Contextual en Ruta:** Incorporar en la Hoja de Ruta (`ViajeConductor.vue`) un enlace de ayuda directa hacia la matriz oficial de instrumentos cuando se ingresen odómetros u horómetros.
4. **Despliegue Certificado:** Sincronizar todos los archivos HTML y las compilaciones de Web y PWA en el ambiente de desarrollo (`DEV`), verificando HTTP 200 OK.

---

## 🏛️ Catálogo Oficial de Documentos Indexados (15 Módulos)
| N° | Archivo HTML | Título Oficial | Audiencia Clave |
| :---: | :--- | :--- | :--- |
| 1 | `centro_documentacion_gsp.html` | Portal Maestro: Centro de Documentación del Sistema | Transversal (Buscador y 15 tarjetas) |
| 2 | `manual_operador_terreno_gsp.html` | Manual Interactivo del Operador en Terreno (Matriz 5 Cols) | Choferes, Operadores, Riggers |
| 3 | `manual_entrega_y_retorno_plataformas_bsm.html` | Manual de Plataformas 360°: Entrega, Retiro y Actas FES | Choferes de Traslado, Clientes ITO |
| 4 | `guia_asignacion_recursos_traslados_y_reports.html` | Guía de Asignación de Recursos, Traslados y Convoy | Planificación, Torre de Control |
| 5 | `marcha_blanca_casos_negocio.html` | Casos de Negocio en Terreno y Marcha Blanca | Operaciones, Prevención |
| 6 | `diseno_real_formularios_mantenimiento.html` | Diseño Real de Formularios e Inspecciones de Mantenimiento | Mecánicos, Jefatura de Taller |
| 7 | `protocolo_verificacion_mantenimiento_e2e.html` | Protocolo de Verificación E2E de Flota y Taller | Supervisores Técnicos |
| 8 | `manual_operativo_inventario_wms_gsp.html` | Manual Operativo de Bodegas, Kardex y Repuestos (WMS-Lite) | Bodegueros, Abastecimiento |
| 9 | `maqueta_mobile_qr_wms.html` | Flujo Móvil de Recepción y Despacho QR WMS | Bodegueros en Terreno |
| 10 | `navegacion_cotizacion_web.html` | Recorrido Guiado de Cotización Comercial en 6 Pasos | Ejecutivos Comerciales, Gerencia |
| 11 | `manual_cotizacion_paso_a_paso.html` | Manual de Cotización, Costeo y Aprobación Comercial | Área Comercial |
| 12 | `simulador_cotizacion.html` | Simulador Dinámico de Tarifas, Distancias y Fletes | Estimadores Comerciales |
| 13 | `presentacion_pipeline_interactivo.html` | Plano Maestro de Procesos & Linaje E2E (6 Etapas) | Jefaturas, Auditoría de Procesos |
| 14 | `proceso_financiero_integral_y_protocolo_pruebas_gsp.html` | Proceso Financiero Integral, EDPs y Cruce de Horas | Finanzas, Analistas PMO |
| 15 | `politica_manejo_excepciones_gsp.html` | Política de Manejo de Excepciones y Liquidación | Facturación, Operaciones |

---

## 📐 Diseño Técnico de la Solución

### 1. Web CRM: Vista Embebida & Enrutamiento
* **Archivo:** `ejecucion/frontend/src/views/DocumentacionView.vue`
* **Comportamiento:** Carga el portal maestro o el documento específico dentro de un `<iframe>` responsivo a pantalla completa, respetando el tema activo y añadiendo una barra superior con:
  * Título del documento activo.
  * Selector rápido de documentos principales.
  * Botón para abrir en pestaña externa maximizada.
* **Ruta:** `/documentacion` y `/lg-gsp-dev/documentacion` en `router/index.js`, con parámetro opcional `?doc=nombre_archivo.html`.

### 2. Web CRM: Navegación en Barra Lateral
* **Archivo:** `ejecucion/frontend/src/components/Sidebar.vue`
* **Ítem Menú:** `Centro de Documentación` (ícono `BookOpen` de Lucide) con subítems:
  1. *Catálogo Completo (15 Módulos)* ➔ `centro_documentacion_gsp.html`
  2. *Manual Operador en Terreno* ➔ `manual_operador_terreno_gsp.html`
  3. *Manual Plataformas 360°* ➔ `manual_entrega_y_retorno_plataformas_bsm.html`
  4. *Inventario WMS-Lite* ➔ `manual_operativo_inventario_wms_gsp.html`
  5. *Plano Maestro E2E* ➔ `presentacion_pipeline_interactivo.html`

### 3. PWA Operador: Acceso Móvil
* **Archivo:** `ejecucion/pwa/src/App.vue`
* **Comportamiento:** En el menú de **"Mi Perfil"** y en la cabecera superior se agregan accesos directos táctiles para abrir el *Manual del Operador en Terreno* y el *Manual de Plataformas 360°*.

### 4. Hoja de Ruta Móvil: Enlace Contextual
* **Archivo:** `ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue`
* **Comportamiento:** En la tarjeta de odómetro y horómetros se añade un enlace discreto de consulta rápida:
  `ℹ️ Consultar Matriz Oficial de Marcadores y Fotos`.

### 5. Script de Despliegue de Documentación
* **Archivo:** `scripts/deploy_docs.cjs`
* **Comportamiento:** Actualizar la lista de archivos a desplegar para transferir los 15 documentos HTML vía SSH a `/var/www/html/lg-gsp-dev/` y fijar permisos `644 nginx:nginx`.

---

## 🔒 Candados de Calidad y Verificación Empírica
1. **Build Web Frontend:** `npm run build:dev` con 0 errores de compilación Vite.
2. **Build PWA:** `npm run build:dev` con 0 errores de compilación Webpack.
3. **Pruebas HTTP 200 OK:** Verificación de acceso a `/lg-gsp-dev/manual_operador_terreno_gsp.html` y `/lg-gsp-dev/centro_documentacion_gsp.html`.
4. **Prohibición de Emojis Restringidos:** Verificación absoluta de ausencia del emoji de grúa.
