# Especificación Técnica Nº 55: Desacoplamiento de Registro de Viaje vs Report Diario, Carga Directa de Combustible en Ruta y Reingeniería de la Portada PWA

* **Código de Especificación**: `Spec 55`
* **Archivo**: `.agents/specs/55_desacoplamiento_viaje_report_y_rediseño_home_pwa_spec.md`
* **Versión**: `1.0.0`
* **Fecha**: `26 de Septiembre de 2026`
* **Autor / Responsable**: Sergio Gajardo / Ingeniero de Software Senior & Arquitectura LeanGlobal
* **Módulos Afectados**:
  * PWA Móvil: `ejecucion/pwa/src/views/Surveys.vue`
  * Frontend Web / Conductor: `ejecucion/frontend/src/views/Operaciones/ViajeConductor.vue`
  * Backend API: `ejecucion/backend_remoto/src/controllers/viajeController.js`
* **Especificaciones Previas Relacionadas**:
  * `Spec 30`: Desplazamiento y Checklist de Salida
  * `Spec 34`: Report Diario Digital de Izaje
  * `Spec 49`: Simplificación de Viaje y Captura de Combustible
  * `Spec 54`: Consolidación de Viajes, Fletes y Report Diario

---

## 1. Diagnóstico Forense y Necesidad Operativa

Durante la marcha blanca con operadores y conductores de grúa en terreno se detectaron tres fricciones de alta gravedad que degradan la experiencia móvil:

1. **Desorden y Sobrecarga Visual en la Portada PWA (`Surveys.vue`):**
   * La vista principal combinaba tarjetas de alturas dispares, destacando de forma desmedida faenas con reportes mezclados con viajes, mientras que en la parte inferior exponía un buscador de texto, filtros de estado y de área, y el botón *"Registrar Inspección/Checklist"*.
   * Para un operador que ingresa desde su teléfono inteligente a las 06:30 AM en patio o a las 18:00 en faena, esta interfaz resultaba dispersa y propensa a equivocaciones.

2. **Acoplamiento Incorrecto de Report en la Hoja de Ruta (`ViajeConductor.vue`):**
   * Cuando el conductor arribaba a faena (`ARRIBADO_FAENA`), la interfaz desplegaba un bloque de más de 1000 líneas con el formulario completo de Reportes Diarios de Izaje multi-día (horas efectivas, colación, firma del mandante, etc.).
   * Esto rompía el principio de separación de responsabilidades: el traslado carretero concluye con el arribo y registro de odómetro/horómetro/combustible. El Report Diario de Izaje es un proceso de faena independiente que debe gestionarse desde su propio acceso en la PWA.

3. **Burocracia y Fricción en Carga de Combustible en Ruta:**
   * El modal de combustible implementaba un flujo de 3 pasos simulando autorización con tarjeta Copec: *1. Solicitar habilitación de tarjeta ➔ 2. Esperar aprobación de torre de control / ID de autorización ➔ 3. Rendición de litros y voucher*.
   * En la realidad operacional, el conductor ya se encuentra en el servicentro o patio y no requiere validación ni espera de autorización de tarjeta: solo debe ingresar directamente los datos reales de la carga (Estanque, Litros, Monto, Odómetro/Horómetro y fotos).

---

## 2. Arquitectura de Dominio y Nuevas Reglas de Negocio

### 2.1. Arquitectura de 3 Tarjetas en Portada PWA (`Surveys.vue`)
La pantalla de inicio de la PWA debe presentar una jerarquía visual homogénea y predecible, utilizando el mismo diseño de tarjeta de fondo azul oscuro noche (`linear-gradient(135deg, #0b1426 0%, #17264a 100%)`) con borde redondeado y contraste accesible:

```
+--------------------------------------------------------------+
| 🚧 CONTROL DE PORTÓN & PATIO                                 |
|    Inspección Autónoma de Equipos (Entrada / Salida)         |
|                                       [ Nueva Inspección ➔ ] |
+--------------------------------------------------------------+
| 🚛 REGISTRO DE VIAJE (DESPLAZAMIENTO)                        |
|    OT: GSP-OT • TYGC-45 (GRÚA 60T)   [ 🔴 PENDIENTE INICIAR ]|
|    📍 Destino: Obra Valdivia                                  |
|                                         [ 🟢 Iniciar Viaje ➔ ]|
+--------------------------------------------------------------+
| 🚜 INGRESO DE REPORT DIARIO (FAENA)                          |
|    OT: GSP-OT • En Faena             [ ⚠️ REPORT PENDIENTE ] |
|    📍 Mandante: Constructora ABC                             |
|                                  [ 🚜 Abrir Report Diario ➔ ] |
+--------------------------------------------------------------+
```

* **Tarjeta 1 — Control de Portón & Patio:**
  * Preservar diseño, ícono `🚧`, textos descriptivos y botón `[ Nueva Inspección ➔ ]`.
* **Tarjeta 2 — Registro de Viaje:**
  * Estilo idéntico a Tarjeta 1.
  * Si el usuario tiene un viaje en estado `ASIGNADO`, muestra alerta parpadeante `🔴 PENDIENTE POR INICIAR` (`animate-pulse`) y botón `[ 🟢 Iniciar Viaje ➔ ]`.
  * Si el usuario tiene un viaje en estado `EN_RUTA`, muestra alerta parpadeante `⚠️ EN TRÁNSITO` (`animate-pulse`) y botón `[ 🛰️ Continuar Registro ➔ ]`.
  * Si el viaje ya arribó o no hay viajes pendientes, muestra estado neutral limpio: `🟢 Sin viajes en carretera` o último trayecto arribado.
* **Tarjeta 3 — Ingreso de Report Diario:**
  * Estilo idéntico a Tarjeta 1.
  * Si el equipo se encuentra arribado en faena o el usuario tiene jornada pendiente de reportar, muestra alerta parpadeante `⚠️ REPORTE PENDIENTE` (`animate-pulse`) y botón directo `[ 🚜 Abrir Report Diario ➔ ]`.
  * Si no hay faena activa, estado neutral: `🟢 Sin reportes pendientes hoy`.
* **Ocultamiento de Módulos Secundarios:**
  * Ocultar temporalmente el bloque de *"Registrar Inspección/Checklist"*, los selectores de filtros (Estados, Área, Texto) y listados que ensucian la pantalla principal.

---

### 2.2. Desacoplamiento Estricto de Hoja de Ruta (`ViajeConductor.vue`)
* **Ciclo de Vida del Viaje Concluido:**
  * El viaje tiene 3 pasos canónicos:
    1. **Salida de Base:** Odómetro inicial, Horómetro inicial, Combustible de salida (Chasis y Grúa si bimotor), Foto de Marcador y PIN.
    2. **En Ruta:** Telemetría GPS, pings automáticos y opción de carga directa de combustible.
    3. **Llegada a Faena:** Odómetro de llegada, Horómetro de llegada, Combustible de llegada, Foto de Marcador y PIN.
  * Una vez registrado el Arribo (`ARRIBADO_FAENA`):
    * Se presenta la tarjeta de cierre exitoso con los odómetros, combustible y fotos de llegada.
    * Se erradica el embebido del formulario de Report Diario dentro del viaje.
    * Se despliega un botón de navegación rápida: `[ 🚜 Volver a PWA / Gestionar Report Diario ➔ ]`.

---

### 2.3. Carga Directa de Combustible en Ruta (Cero Validación de Tarjeta)
* El modal de combustible se simplifica a un formulario de paso único (`modalCombustible.paso = 1` único):
  * **Estanque Abastecido:** Selector explícito (Principal Chasis / Superestructura Grúa / Auxiliar Reserva).
  * **Litros Cargados:** Campo numérico decimal (ej: `150.5`).
  * **Monto Total ($ CLP):** Campo numérico entero (ej: `185000`).
  * **Odómetro Actual (KM) & Horómetro Actual (HRS):** Campos numéricos para balance volumétrico.
  * **Foto del Voucher / Boleta:** Captura fotográfica obligatoria.
  * **Foto del Tablero / Marcador:** Captura fotográfica de respaldo.
  * **Botón de Envío Directo:** `[ ⛽ Registrar Carga de Combustible ]`.
* No se solicita habilitación de tarjeta Copec ni se espera código de autorización de la torre de control. El payload se registra directamente en `tedp_costos_servicio` asociando `id_autorizacion_copec: 'DIRECTO'`.

---

## 3. Plan de Verificación y Auditoría
1. **Auditoría de Portada PWA (`Surveys.vue`):**
   * Verificar en navegador móvil que las 3 tarjetas se desplieguen secuencialmente con estilo uniforme.
   * Simular viaje asignado y comprobar alerta parpadeante `🔴 PENDIENTE POR INICIAR`.
   * Simular equipo arribado y comprobar alerta parpadeante en tarjeta de Report Diario.
   * Verificar ausencia de selectores de filtros y botón secundario de protocolos.
2. **Auditoría de Hoja de Ruta (`ViajeConductor.vue`):**
   * Abrir modal de combustible en ruta y confirmar pantalla directa sin pasos de tarjeta Copec.
   * Completar llegada a faena y verificar que muestre el resumen de arribo sin embeber el formulario gigante de Report Diario.
3. **Compilación y Despliegue:**
   * `npm run build` en `ejecucion/pwa` con 0 errores.
   * `npm run build` en `ejecucion/frontend` con 0 errores.
