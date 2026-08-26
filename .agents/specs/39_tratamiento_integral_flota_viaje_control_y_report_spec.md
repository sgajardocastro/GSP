# 📐 Especificación Técnica: Tratamiento Integral de Registros de Flota – Viaje, Control de Flota y Report Diario (Spec 39)

**Documento:** `39_tratamiento_integral_flota_viaje_control_y_report_spec.md`  
**Ecosistema:** Grúas San Pablo (GSP) / LeanGlobal Platform  
**Fase de Dominio:** Fases 4, 5 y 6 – Logística de Transporte, Operación en Terreno y Liquidación Comercial  
**Estado:** `ESPECIFICACIÓN FORMAL - DEFINITIVA & CONSOLIDADA`  
**Fecha:** 26 de Agosto de 2026  

---

## 1. 📌 Resumen Ejecutivo y Alcance Arquitectónico

La presente especificación establece el **Modelo Canónico de 3 Pilares** para la gestión y captura de información de la flota de maquinaria pesada, grúas y camiones de Grúas San Pablo (GSP). 

Este modelo desacopla la **logística interna de carretera**, el **control técnico de mantenimiento del activo** y el **documento contractual de cobro cara al mandante**, garantizando privacidad industrial, precisión en la captura de odometría/horometría y cero doble digitación en terreno.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   1. REGISTRO DE VIAJE (Logística & Desplazamiento)                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Alcance: Traslado carretero [ Patio ➔ Faena ] / [ Faena ➔ Patio ].                   │
│ • Responsable: Conductor / Operador del equipo en ruta.                                │
│ • Captura: Fecha/Hora/Min inicio y término, Odómetro, Horómetro + Foto del tablero.    │
│ • Combustible: Habilitación Tarjeta Copec (regla < 3/4 estanque), multi-estanque,      │
│   litros cargados y fotografía del voucher.                                            │
│ • Autenticación: PIN de 4 dígitos (Firma FES Conductor).                               │
│ • Carácter: Operativo / Logístico Interno GSP.                                         │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          ▼ (Arribo confirmado a faena)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   2. CONTROL DE FLOTA (Gestión Técnica Interna GSP)                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Alcance: Registro técnico de inicio y término de la jornada diaria en faena.         │
│ • Responsable: Operador de la máquina (ingreso manual asistido).                       │
│ • Captura: Fecha, Horómetro diario, Odómetro, Foto obligatoria de tablero y            │
│   comentarios mecánicos/mantenimiento GSP.                                             │
│ • Carácter: Estrictamente INTERNO GSP (Taller, Rendimientos y Desgaste del Activo).    │
│ • 🔒 Privacidad: NUNCA se exhibe al cliente mandante.                                  │
└─────────────────────────────────────────┬──────────────────────────────────────────────┘
                                          ▼ (Alimenta y auto-puebla automáticamente)
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   3. REPORT (Reporte Diario Contractual Cara al Mandante)              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ • Alcance: Documento formal de liquidación y respaldo de la jornada diaria de faena.  │
│ • Origen: Nace a partir del Control de Flota, acotado exclusivamente a tiempos.        │
│ • Captura: Horario Citado vs. Real, Horas Efectivas, Colación, Sobretiempo y Maniobra. │
│ • Validación: FIRMA MANUAL TÁCTIL (Touchscreen Canvas) del Supervisor Mandante + GPS.  │
│ • Carácter: COMERCIAL / CONTRACTUAL (Insumo inmutable para Estado de Pago - EDP).      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 🛣️ PILAR 1: REGISTRO DE VIAJE (LOGÍSTICA & DESPLAZAMIENTO)

### 2.1. Propósito y Alcance
Registrar el trayecto de ida y vuelta de cada máquina entre las bases de GSP y las obras de los clientes. Opera de forma desacoplada y escalonada por equipo mediante la web móvil `/viaje/:token`.

### 2.2. Flujo Operativo y Puntos de Control:
1. **Inicio de Viaje en Patio:**
   * Odómetro de salida (KM) y Horómetro de salida (HRS).
   * **Foto obligatoria del tablero** en base.
   * Firma con **PIN FES de 4 dígitos** del conductor.
   * Transición del equipo a micro-estado `EN_RUTA`.
2. **En Trayecto Activo & Telemetría:**
   * Transmisión periódica de pings GPS con velocidad y coordenadas.
   * Cronómetro de tiempo en ruta.
3. **Protocolo de Carga de Combustible (Tarjeta Copec en Ruta):**
   * *Regla de Negocio:* Obligatoria cuando el nivel del estanque baja de $3/4$.
   * *Solicitud Remota:* Conductor pulsa `[ Solicitar Carga de Combustible ]` ingresando odómetro actual.
   * *Handshake:* Coordinador de Operaciones autoriza y asigna código de habilitación de tarjeta Copec.
   * *Registro de Carga:* Conductor selecciona el estanque específico (Estanque Chasis Principal / Estanque Auxiliar / Estanque Grúa), ingresa los litros cargados y captura la **foto obligatoria del voucher Copec**.
4. **Arribo a Faena / Cierre de Viaje:**
   * Odómetro y Horómetro de llegada a faena.
   * Foto obligatoria del tablero en obra.
   * PIN del conductor y sellado del viaje.
   * Transición a micro-estado `ARRIBADO` / `EN_FAENA`.
   * Generación del **Log Maestro de Desplazamiento** con cálculo de $\Delta\text{KM}$ y $\Delta\text{Horas Tránsito}$.

---

## 3. 🚜 PILAR 2: CONTROL DE FLOTA (GESTIÓN TÉCNICA INTERNA GSP)

### 3.1. Propósito y Alcance
Permitir el control técnico, mecánico y operativo del activo durante la faena, registrando el desgaste diario del motor y chasis para el área de Mantenimiento y Taller de GSP.

### 3.2. Estructura de Captura:
* **Identificación del Activo:** Grúa / Camión Pluma (Patente, Modelo, Marca, Capacidad Nominal).
* **Jornada Técnica:** Fecha, Hora de Encendido y Hora de Apagado de motor.
* **Odometría & Horometría Diaria:**
  * Horómetro Inicial (precargado del día anterior) y Horómetro Final del día.
  * Odómetro del día (si la grúa realizó traslados internos dentro de la faena).
  * 📸 **Fotografía obligatoria del tablero de instrumentos.**
* **Comentarios Mecánicos y de Taller (Privados GSP):**
  * Estado de neumáticos, niveles de aceite, alertas del computador de abordo, pérdidas menores de fluido, estado de aparejos y lingas.
* **Cálculo de Desgaste:** $\Delta\text{Horómetro Motor} = \text{Horómetro Término} - \text{Horómetro Inicio}$.

---

## 4. 📋 PILAR 3: REPORT DIARIO (CARA AL CLIENTE MANDANTE)

### 4.1. Propósito y Alcance
Generar el documento contractual de respaldo de la jornada diaria que se le presenta al **Supervisor Mandante en Obra (ITO / Jefe de Terreno)** para su aprobación y firma manuscrita en pantalla táctil.

### 4.2. Reglas de Negocio del Formulario Móvil PWA:
1. **Precarga Automática:** Código OT, Razón Social real del Mandante (`tpar_empresas`), Nombre y Dirección de Faena, Grúa y Tripulación (Operador y Rigger).
2. **Horarios Flexibles e Ingreso Manual:** Selectores nativos de Hora Inicio y Hora Término.
3. **Selector de Colación 1-Tap:** Botones táctiles de 48px mínimos `[ Sin Colación (0h) ] [ 30m ] [ 45m ] [ 60m ] [ 90m ]`.
4. **Badge de Resumen Horario Reactivo (Visible en UI):**
   $$\text{Horas Totales Jornada} = (\text{Hora Término} - \text{Hora Inicio})$$
   $$\text{Horas Efectivas} = \text{Horas Totales} - \text{Horas Colación}$$
   $$\text{Horas Facturables} = \max(\text{Horas Efectivas}, \text{Horas Mínimas OT})$$
   $$\text{Sobretiempo Devengado} = \max(0, \text{Horas Efectivas} - \text{Horas Mínimas OT})$$
   * *Badge en pantalla:* `⏱️ Total Horas Jornada: 10.5 hrs • Colación: 1.0 hr • Horas Efectivas: 9.5 hrs (Sobretiempo: +1.5 hrs)`.
5. **Observaciones de Maniobra:** Descripción de izajes, tonelajes movilizados, radios, interferencias y clima.
6. **Firma Manual del Mandante:**
   * Nombre completo, RUT y Cargo del Supervisor Mandante.
   * Lienzo táctil Canvas HTML5 (`SignatureField.vue`) para firma con el dedo o lápiz óptico.
   * Captura automática de geocodificación GPS inmutable (`latitud`, `longitud`, `precisión en metros`) y timestamp.

---

## 5. 🖥️ INTEGRACIÓN EN TORRE DE CONTROL CRM (GESTIÓN Y FINANZAS)

El Gestor de Oportunidades CRM organiza estas tres dimensiones en subpestañas especializadas para proyectos en ejecución (`estado >= 5`):

```
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      SUBPESTAÑAS DE OPERACIONES EN TORRE DE CONTROL                    │
 ├────────────────────────────────────────────────────────────────────────────────────────┤
 │ [ 4. Acreditaciones ]                                                                  │
 │   • Expediente documental consolidado (Empresa, Flota y Personal).                    │
 │                                                                                        │
 │ [ 5. Control de Flota & Despacho ]                                                     │
 │   • Monitoreo de viajes en ruta (/viaje/:token) y telemetría GPS.                      │
 │   • Historial técnico diario de horómetros, odómetros y fotos de tablero de Taller.    │
 │   • Solicitudes y autorizaciones de combustible Copec en ruta.                         │
 │                                                                                        │
 │ [ 6. Reportes Diarios de Izaje ]                                                       │
 │   • DataGrid cronológico multi-día con los Reports firmados por los mandantes.         │
 │   • Filtros tipo píldora por equipo [ TODOS ] [ 🚜 Grúa 1 ] [ 🏗️ Grúa 2 ].           │
 │   • Visor formal de documento digital con estampa de firma manuscrita y GPS.           │
 │   • Botón [ ✅ Validar Report ] para control de calidad del Analista de Operaciones.   │
 │                                                                                        │
 │ [ 7. Liquidación, Devengado & EDP ]                                                    │
 │   • Termómetro financiero de Ingreso Devengado en tiempo real.                         │
 │   • Conciliación automática de tarifas pactadas vs. horas facturables y sobretiempos.  │
 │   • Emisión de Carátula Oficial de Estado de Pago (EDP 1, EDP 2... EDP N).            │
 │   • Registro de Facturación oficial (N° Factura, N° HES/OC) y Cierre de Servicio.      │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 🗄️ Modelo Relacional de Base de Datos PostgreSQL

```sql
-- 1. Registro de Desplazamiento y Combustible
-- Tabla: sch_leangsp.tequ_log_desplazamiento
-- Campos: id_log_desplazamiento, id_proyecto, id_equipo, id_user_conductor, token_viaje,
--         tipo_trayecto (PATIO_FAENA / FAENA_PATIO), km_inicial, km_final, foto_tablero_salida,
--         foto_tablero_llegada, horometro_inicial, horometro_final, litros_cargados,
--         estanque_cargado, foto_voucher_copec, estado_trayecto.

-- 2. Reporte Diario y Control de Faena
-- Tabla: sch_leangsp.tedp_reporte_avance
-- Campos: id_reporte_avance, id_proyecto, id_equipo, id_user_operador, id_user_rigger,
--         dia_correlativo, fecha_reporte, fecha_inicio_servicio, fecha_termino_servicio,
--         horas_colacion, horas_operadas, horas_minimas, horas_facturables, horas_sobretiempo,
--         horometro_inicio, horometro_termino, foto_horometro, observacion_trabajo,
--         cliente_nombre, cliente_rut, cliente_cargo, cliente_firma_canvas_base64,
--         latitud_inicio_servicio, longitud_inicio_servicio, accuracy_firma, token_report,
--         estado_reporte, id_user_validador, fecha_validacion, obs_validador.

-- 3. Liquidación y Facturación de la OT
-- Tabla: sch_leangsp.tpry_proyecto -> json_field->'liquidacion_v1'
-- Campos: total_horas_base, total_horas_sobretiempo, monto_neto_equipos, monto_neto_sobretiempo,
--         monto_neto_flete, subtotal_neto, iva_19, total_bruto, hes_oc_numero, factura_numero,
--         fecha_facturacion, observaciones_facturacion, estado_financiero.
```

---

## 7. 🧪 Matriz de Verificación QA (Protocolo Cero Confianza)

| ID | Prueba de Validación | Criterio de Aceptación |
| :--- | :--- | :--- |
| **QA-39-01** | Inicio de Viaje con PIN | El conductor ingresa odómetro/horómetro y PIN en `/viaje/:token`, el sistema guarda foto de tablero y cambia estado a `EN_RUTA`. |
| **QA-39-02** | Solicitud Combustible Copec | Al registrar carga en ruta, el sistema almacena litros, tipo de estanque seleccionado y foto del voucher. |
| **QA-39-03** | Arribo y Despacho Escalonado | Cada grúa del proyecto registra su arribo de forma independiente sin bloquear a las demás máquinas. |
| **QA-39-04** | Auto-Poblado de Report Diario | Al abrir la PWA, los datos del cliente, grúa, tripulación y horas mínimas aparecen precargados. |
| **QA-39-05** | Cálculo Horario Reactivo | Al ingresar horarios (ej. 08:00 a 18:30 con 60m colación y 8h base), la UI despliega el badge con 9.5 hrs efectivas y +1.5 hrs sobretiempo. |
| **QA-39-06** | Firma Táctil Mandante y GPS | El supervisor del cliente firma en pantalla Canvas, se captura PNG Base64 y coordenadas GPS inmutables. |
| **QA-39-07** | Validación Analista Torre Control | En Subpestaña 6 del CRM, el analista aprueba el report con 1 clic (`VALIDADO_ANALISTA`). |
| **QA-39-08** | Carátula EDP & Cierre Factura | En Subpestaña 7, se genera la Carátula EDP consolidando horas reales × tarifa + flete, y al ingresar N° Factura el proyecto pasa a Estado 7. |
