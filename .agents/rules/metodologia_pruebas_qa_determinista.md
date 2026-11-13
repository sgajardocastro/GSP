# Regla Canónica: Metodología de Pruebas QA Deterministas y Auditoría Empírica

> **Aplica a:** Ecosistema Grúas San Pablo (GSP) — Backend Node.js, Frontend Vue 3 (Vite), PWA Operador (Webpack), PostgreSQL y Servicios Puppeteer.  
> **Estado:** Obligatorio e Inviolable.  
> **Candado:** Hard Gate en pre-despliegue (Cero tolerancia a fallos).

---

## 1. Filosofía de Pruebas Deterministas: Cero Suposiciones y Cero Mocks Ciegos

El ecosistema de desarrollo de Grúas San Pablo rechaza categóricamente las prácticas de aseguramiento de calidad basadas en "pruebas mentales", "suposiciones de funcionamiento" o "mocks ciegos de prueba unitaria" que no interactúan con la infraestructura viva.

### Principios Fundamentales
1. **Cero Suposiciones:** El hecho de haber redactado o modificado una línea de código no certifica que el software funcione. Toda afirmación de éxito debe estar respaldada por una ejecución real con evidencia reproducible (código de estado HTTP, latencia en ms, hash criptográfico, registro en base de datos).
2. **Prohibición de Mocks Ciegos:** Los mocks que simulan respuestas estáticas ocultan discrepancias de contrato API, cambios en esquemas de base de datos, desincronizaciones de tipos JSON, incompatibilidades de red y fallos de renderizado en Puppeteer. Las pruebas oficiales de integración y aceptación se ejecutan **contra endpoints y bases de datos reales**.
3. **Determinismo y Repetibilidad:** Todo caso de prueba debe producir un veredicto binario incontrovertible: **PASA** o **FALLA**. Si el resultado difiere de la especificación técnica en un solo byte, el caso es considerado **FALLA**.
4. **Candado de Salida (Hard Gate):** Ningún commit, release o despliegue a producción puede ser autorizado si la suite determinista no obtiene una tasa de aprobación del **100%**. Un solo fallo bloquea de manera inmediata el pase a producción.

---

## 2. Arquitectura del Entorno de Pruebas Oficial

El ecosistema de pruebas opera bajo un **Modelo de Ejecución Dual**, conectando aplicaciones locales de desarrollo con el backend de pruebas persistente y base de datos relacional en la nube de desarrollo (DEV):

```
+-----------------------------------------------------------------------------------+
|                            ENTORNO LOCAL (ESTACIÓN QA)                             |
|                                                                                   |
|   +----------------------------------+     +----------------------------------+   |
|   |         Web CRM / Consola        |     |       PWA Operador Terreno       |   |
|   |          Vite (Puerto 5173)      |     |      Webpack (Puerto 8085)       |   |
|   |  http://localhost:5173/lg-gsp-dev/|   |  http://localhost:8085/pwa-gsp-dev/|  |
|   +-----------------+----------------+     +-----------------+----------------+   |
+---------------------|----------------------------------------|--------------------+
                      |                                        |
                      |   Llamadas API REST (Bearer Token)     |
                      v                                        v
+-----------------------------------------------------------------------------------+
|                        SERVIDOR REMOTO DEV (138.255.103.18)                       |
|                                                                                   |
|   +---------------------------------------------------------------------------+   |
|   |                         Proxy Inverso Nginx / SSL                         |   |
|   |                   https://servidor.leanglobal.cl/                         |   |
|   +-------------------------------------+-------------------------------------+   |
|                                         |                                         |
|                                         v (Proxy local a puerto 3006)             |
|   +---------------------------------------------------------------------------+   |
|   |                  Backend Node.js / Express (lg-gsp-dev)                   |   |
|   |                  Base URL: /lg-gsp-dev/api (Puerto 3006)                  |   |
|   |             Auth Middleware / AES-256 Token / Rutas de Negocio            |   |
|   +------------------+--------------------------------------+-----------------+   |
|                      |                                      |                     |
|                      v                                      v                     |
|   +--------------------------------------+   +--------------------------------+   |
|   |          Motor Puppeteer             |   |        Motor PostgreSQL        |   |
|   |       Generador PDF Headless         |   |         Puerto 1295 / Unix     |   |
|   |  (Contratos, Report Diario, Actas)   |   |      Esquema: sch_leangsp      |   |
|   +--------------------------------------+   +--------------------------------+   |
+-----------------------------------------------------------------------------------+
```

### Componentes de la Arquitectura
- **Web CRM / Portal Central:** Ejecutado en local mediante Vite en el puerto `5173`. Base URL `/lg-gsp-dev/`.
- **PWA Operador:** Aplicación web progresiva móvil ejecutada mediante Webpack Dev Server en el puerto `8085`. Base URL `/pwa-gsp-dev/`.
- **Backend Remoto DEV:** API oficial alojada en servidor remoto bajo Nginx con HTTPS en `https://servidor.leanglobal.cl/lg-gsp-dev/api` (instancia de servicio en puerto interno 3006).
- **Base de Datos PostgreSQL:** Servidor PostgreSQL remoto en puerto `1295`. El esquema oficial de pruebas y desarrollo es estrictamente `sch_leangsp`.
- **Generador de Documentos Puppeteer:** Microservicio interno Node.js capaz de renderizar vistas HTML dinámicas en Chromium headless para compilar documentos legales oficiales en PDF.

---

## 3. Matriz de Usuarios y Personas de Prueba

Las pruebas deterministas deben validar las operaciones simulando los roles organizacionales reales del negocio. Cada perfil cuenta con permisos y alcances definidos en `tsec_users` y `tsec_roles`:

| Perfil / Persona | Usuario / Email | ID DEV | Roles Asignados | Alcance Operativo en Pruebas |
|---|---|---|---|---|
| **Administrador / PMO / Comercial** | `leangsp` (`lguser@arriendosanpablo.cl`) | `1` / `59` | `GSP_ADMIN`, `OPERACIONES`, `COMERCIAL` | Gestión completa de OTs, revisión de cotizaciones, autorización de extensiones comerciales de servicio, despacho y emisión de contratos legales. |
| **Operador de Terreno / Conductor** | `robert` (`triarrodriguez2@gmail.com`) | `49` | `USR-CONSENT`, Operador de Terreno | Registro de desplazamientos (odómetro, combustible salida/retorno), checklists diarios, registro de horómetros y reporte diario de izaje con standbys. |
| **Inspector Técnico (ITO) / Mandante** | Usuario Mandante en Faena | Variable por OT | Firma Externa Mandante | Validación en terreno de horas efectivas y standbys, firma FES en pantalla táctil con sellado de acta o reporte diario. |

---

## 4. Categorías de Validación Determinista

La batería de pruebas se divide en 5 categorías obligatorias e interdependientes:

### Categoría A: Salud y Disponibilidad de Frontends Locales
Valida que los servidores de desarrollo local estén activos, respondiendo HTTP 200 y sirviendo paquetes HTML/JS sin errores de bundling.

- **Frontend Web CRM:** Verificación de `http://localhost:5173/lg-gsp-dev/` (Status HTTP 200, latencia < 300ms).
- **PWA Operador:** Verificación de `http://localhost:8085/pwa-gsp-dev/` (Status HTTP 200, latencia < 300ms).
- **Condición de Falla:** Respuestas HTTP 404, 500 o fallas de conexión (`ECONNREFUSED`).

### Categoría B: Autenticación y Handshake con Token Cifrado Real
El sistema utiliza una arquitectura de doble capa de seguridad: un JSON Web Token (JWT) firmado con `JWT_SECRET` y posteriormente cifrado en AES-256-CBC con clave derivada mediante `scrypt` usando `JWT_ENCRYPT_SECRET` y vector de inicialización nulo (16 bytes en cero).

- **Encabezado:** `Authorization: Bearer <token_cifrado_hex>`
- **Payload Esperado:** Objeto que incluye `{ id_user, rut, email, nombre, id_empresa, flag_proc_enrol, roles }`.
- **Prueba Canónica:** Consumo de endpoint protegido `GET /lg-gsp-dev/api/proyectos` con token real.
- **Criterio de Éxito:** HTTP 200 OK y entrega de un array JSON de proyectos activos.

### Categoría C: Consistencia y Aritmética de Reglas de Negocio
Las reglas operacionales de izaje y arriendo de grúas exigen cálculos matemáticos exactos en reportes diarios y contratos:

#### 1. Fórmulas de Jornada y Horas de Izaje
```
Jornada Bruta (h) = Hora Fin Faena - Hora Inicio Faena
Jornada Neta (h) = Jornada Bruta - (Tiempo Colacion Min / 60)
Horas Operadas Efectivas = Jornada Neta - Horas Standby Mandante - Horas Standby GSP
```

#### 2. Clasificación de Detenciones (Standby)
- **Standby Mandante (Cliente):** Detención imputable exclusivamente al mandante (falta de permisos, ausencia de rigger, frentes de trabajo no liberados, condiciones climáticas/viento con anemómetro mandante). **Estas horas son computables y se cobran al cliente.**
- **Standby GSP (Grúas San Pablo):** Detención imputable a GSP (panne mecánica, mantenimiento correctivo menor en obra, falta de combustible por descuido de patio, demora de operador). **Estas horas son deducibles y NO se cobran al mandante.**
- **Horas Facturables:** El mayor valor entre las Horas Mínimas Garantizadas pactadas contractualmente (típicamente 8 o 9 horas) y la suma de `Horas Operadas Efectivas + Horas Standby Mandante`.
- **Sobretiempo:** Cualquier hora neta computable que exceda la jornada ordinaria legal o contractual pactada.

#### 3. Horómetros de Máquina
- **Horómetro Chasis / Motor:** Campo obligatorio continuo (`horometro_fin >= horometro_inicio`).
- **Horómetro Superestructura:** Campo **opcional por defecto**, aplicable únicamente en grúas telescópicas o celosía con doble motor independiente.

### Categoría D: Generación, Compilación y Sellado Documental Puppeteer
Los documentos legales (Contrato de Arriendo de Equipo, Reporte Diario de Izaje, Acta de Plataforma 360°) deben compilarse en PDF con estricto apego al estándar:

1. **Cabecera Binaria:** El buffer de salida DEBE iniciar obligatoriamente con la secuencia `%PDF-`.
2. **Tamaño Mínimo de Buffer:** Todo PDF emitido debe superar los `10.240 bytes (10 KB)` (los reportes completos oscilan entre 25 KB y 85 KB). Un tamaño menor indica página en blanco o error de captura.
3. **Firma Electrónica Simple (FES):**
   - Incorporación de firma manuscrita digitalizada (base64 PNG de trazo vectorial).
   - Metadatos del firmante (Nombre, RUT, Rol, Fecha/Hora exacta UTC-3, Dirección IP o Hash).
   - Identificador único de auditoría y enlace/código QR de verificación.
4. **Idempotencia Documental:** La recompilación de un documento sobre un registro inmutable debe mantener consistencia de folio y contenido.

### Categoría E: Integridad Relacional y Gobernanza de Base de Datos
1. **Esquema de Destino:** Pruebas restringidas de forma absoluta al esquema `sch_leangsp`. Prohibición tajante de realizar escrituras de prueba sobre `sch_leangsp_prod`.
2. **Tablas Nucleares Auditadas:**
   - `tlog_desplazamiento`: Trazabilidad de salida y retorno, odómetros, y control de combustible en patio y retorno.
   - `tedp_reporte_avance` / `tope_reporte_diario`: Persistencia exacta de horómetros, standby cliente, standby GSP, motivo textual y firma mandante.
   - `tope_acta_plataforma`: Actas 360° con desglose fotográfico, firma digital y checklists de inspección.
3. **Aislamiento de Datos de Prueba:** Todo registro insertado por suites automatizadas debe incluir en sus campos de observación el prefijo unívoco `QA AUTOMATIZADO:` para permitir depuración y trazabilidad.

---

## 5. Protocolo de Ejecución Pre-Despliegue (Hard Gate Protocol)

Antes de cualquier despliegue a producción o cierre de un ciclo de desarrollo (Sprint/Release), el responsable técnico o agente de aseguramiento debe ejecutar el siguiente flujo determinista:

```
+-----------------------------------------------------------------------+
|                 PASO 1: INSPECCIÓN ESTÁTICA Y HIGIENE                 |
|  - Auditoría de esquemas hardcodeados:                                |
|    git grep -n "sch_leangsp\." ejecucion/backend_remoto/src           |
|    (Resultado requerido: 0 ocurrencias)                               |
|  - Verificación de rutas prohibidas (/u05/LeanDocs en frontend)       |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|               PASO 2: EJECUCIÓN DE BATERÍA DETERMINISTA               |
|  Ejecución en consola:                                                |
|  node scripts/qa_test_suite_standard.cjs                              |
+-----------------------------------+-----------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                    PASO 3: EVALUACIÓN DE CANDADO                      |
|                                                                       |
|   ¿100% de pruebas con veredicto PASA?                                |
|   - NO (>= 1 fallo) -> HARD STOP. Despliegue CANCELADO.               |
|                        El ticket se devuelve al desarrollador con     |
|                        la salida exacta de la consola.                |
|   - SÍ (100% éxito) -> HARD GATE DESBLOQUEADO. Pase autorizado.       |
+-----------------------------------------------------------------------+
```

---

## 6. Formato de Salida Determinista Canónico

La salida de la suite debe imprimirse en consola en formato tabular estructurado, permitiendo su almacenamiento como artefacto de auditoría:

| Módulo | Caso de Prueba | Endpoint / Recurso | Resultado Esperado | Resultado Obtenido | Latencia (ms) | Veredicto |
|---|---|---|---|---|---|---|
| Frontend Local | Vite Dev Server (Web CRM) | `http://localhost:5173/lg-gsp-dev/` | HTTP 200 OK | HTTP 200 | 45ms | PASA |
| Frontend Local | Webpack Server (PWA) | `http://localhost:8085/pwa-gsp-dev/` | HTTP 200 OK | HTTP 200 | 22ms | PASA |
| Autenticación | Handshake Token Cifrado | `/lg-gsp-dev/api/proyectos` | HTTP 200 con nómina | HTTP 200 con array OTs | 380ms | PASA |
| Desplazamiento | Combustible Patio y Retorno | `ViajeConductor.vue` | Captura patio/retorno | Confirmada en template | - | PASA |
| Base de Datos | Columnas Standby | `tedp_reporte_avance` | 3 columnas requeridas | 3 columnas presentes | 120ms | PASA |
| Report Diario | Cálculo Standby & Efectivas | `/operaciones/report/guardar` | Persistencia y cálculo exacto | HTTP 201, cli=4, gsp=1 | 290ms | PASA |
| Documentos PDF | Compilación Puppeteer Report | `reportDiarioPdfService.js` | Buffer binario %PDF- > 10KB | %PDF- generado (71.2 KB) | 1250ms | PASA |
| Documentos PDF | Generación Contrato OT | `/proyectos/:id/contrato/generar-pdf` | HTTP 200 con URL PDF | HTTP 200 con archivo válido | 4100ms | PASA |

---

## 7. Directiva de Responsabilidad, Certificación E2E de Negocio y Cero Confianza Inter-Agentes

> **Skill Corporativo Transversal Obligatorio:**  
> Consúltese y aplíquese sin excepción [leanglobal_qa_e2e_business_certification/SKILL.md](file:///d:/SGajardo/Google Drive/Antigravity/LeanGlobal - Product/.agents/skills/leanglobal_qa_e2e_business_certification/SKILL.md) (y réplica local en [skills/leanglobal_qa_e2e_business_certification/SKILL.md](file:///d:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/.agents/skills/leanglobal_qa_e2e_business_certification/SKILL.md)).

1. **Separación de Roles (`qa-business-specialist`):** El agente desarrollador no puede auto-certificar sus cambios. Toda certificación debe ser ejecutada por un subagente especialista independiente bajo protocolo de Cero Confianza.
2. **Prohibición de Pruebas Parciales — Ciclo Completo E2E Obligatorio:** Toda prueba de un requerimiento debe recorrer desde la entrada comercial, pasando por validaciones obligatorias, rechazos/devoluciones con motivo y fecha, notificaciones (`tnot_notification_log`), hasta el cálculo matemático real en Cobro al Cliente (EDP) y Liquidación de Incentivos de Trabajadores (RRHH).
3. **Estructura Física en `QA/` y Triple Evidencia:** Todo proceso QA debe generar su carpeta dedicada `QA/REQ-XXXX_<Descripcion>_<DEV|PROD>/` con el informe `REPORTE_QA_INTEGRAL_REQ-XXXX_<DEV|PROD>.md`, el script reproducible y la carpeta `evidencia/*.png` (capturas Puppeteer, Caja Blanca SQL y tablas de cuadratura matemática).
4. **Persistencia Obligatoria de Casos Testigo en `DEV` (Prohibido Teardown):** En el ambiente `DEV`, los casos de prueba creados (`[QA-REQXXXX - ESCENARIO N]`) **no deben ser eliminados** al finalizar la suite, debiendo quedar vivos y listados con sus URLs directas en la Sección 1 del informe para inspección humana inmediata.
5. **Tolerancia Cero a Excepciones:** La indisponibilidad temporal de un servicio o base de datos no es causal de "aprobación provisional con advertencia"; constituye un rechazo categórico hasta que el servicio esté restablecido y la prueba pase al 100%.
