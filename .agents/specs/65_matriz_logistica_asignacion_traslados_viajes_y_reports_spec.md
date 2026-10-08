# Especificación Técnica & Modelo Operacional 65: Matriz Logística de Asignación de Recursos, Desacoplamiento de Traslados, Ciclo de Viajes y Emisión de Reports

> **Estado:** ESPECIFICACIÓN CANÓNICA CORE  
> **Código de Especificación:** `SPEC-065`  
> **Fecha:** 2026-10-07  
> **Área:** Operaciones, Logística de Transporte, Gestión de OTs, Remuneraciones (Art. 25 bis)  
> **Módulos Core:** Asignación de Recursos (Pestaña C), Registro de Viaje PWA, Report Diario PWA, Control en Vivo, Liquidación HH  
> **Especificaciones Relacionadas:** `SPEC-016` (Gestor de Oportunidades y Estructurador CRM), `SPEC-022` (Asignación de Recursos DB), `SPEC-039` (Tratamiento Integral Flota, Viaje y Report), `SPEC-049` (Secuencia Viaje y Combustible)  
> **Tablas Afectadas:** `tpry_proyecto`, `tequ_rel_proyecto_equipo`, `tpry_rel_persona`, `tequ_log_desplazamiento`, `tedp_reporte_avance`  
> **Versión de Referencia Implementada:** `v1.0.109` (CRM Web) / `REQ-1011`

---

## 1. Alcance y Principio Fundamental Core

Esta especificación constituye el estándar canónico del ecosistema Grúas San Pablo (GSP) para gobernar de forma indivisible:
1. Las líneas de servicio y cobro estructuradas en la propuesta comercial (CRM).
2. La asignación física de equipos y personal en Operaciones (Pestaña C).
3. El ciclo operativo de transporte vial carretero (Hojas de Ruta de Desplazamiento).
4. El ciclo operativo de maniobras en faena (Reports Diarios de Izaje firmados por el mandante).
5. La captura de tiempos y telemetría para la liquidación de horas conductor y operador bajo la legislación laboral chilena.

### Axioma de Aislamiento Operativo:
> **"Un traslado de equipo autopropulsado es un concepto comercial de cobro; no constituye una unidad de asignación vehicular independiente ni admite tripulación paralela. El cliente mandante firma un único Report Diario de servicio por grúa en faena; los vehículos auxiliares de transporte rinden Hojas de Ruta, nunca Reports de Izaje."**

---

## 2. Taxonomía Cinemática de la Flota

Para erradicar asignaciones redundantes y colisiones de roles en base de datos, todo equipo registrado en `tequ_equipo` queda tipificado bajo las siguientes categorías operacionales:

| Categoría Cinemática | Ejemplos en Flota GSP | Capacidad de Autotraslado | Régimen en Asignación (Pestaña C) |
| :--- | :--- | :---: | :--- |
| **AUTOPROPULSADO_PESADO** | Grúas Telescópicas Liebherr LTM (90T a 400T), Grove, Tadano | Sí (Chasis vial propio) | Se asigna como **Equipo Principal**. Su operador es a la vez su conductor carretero. |
| **AUTOPROPULSADO_LIVIANO** | Camiones Pluma, Hidrogruas sobre camión | Sí (Camión comercial) | Se asigna como **Equipo Principal**. Su operador es a la vez su conductor carretero. |
| **TRANSPORTE_CONTRAPESOS** | Tractocamiones con semirremolque plataforma / cama baja | Sí (Tracto + Semirremolque) | Se asigna como **Equipo de Apoyo Logístico**. Requiere Chofer de Transporte Pesado. |
| **TRANSPORTE_CARGA_TERCEROS**| Camiones Cama Baja para transporte de maquinaria de clientes | Sí (Tracto + Cama Baja) | Se asigna como **Equipo Principal de Transporte** (Caso Flete Puro). Requiere Chofer. |
| **APOYO_VIAL_ESCOLTA** | Camionetas de acompañamiento, vehículos piloto MOP | Sí (Vehículo liviano) | Se asigna como **Recurso de Seguridad Vial**. Requiere Chofer Escolta. |
| **ESTACIONARIO_NO_VIAL** | Grúas celosía sobre orugas, plataformas tijera, torres de iluminación | No (Requiere cama baja) | Se asigna como Equipo Principal en faena, pero exige obligatoriamente un **Servicio de Traslado en Cama Baja** asignable. |

---

## 3. Matriz Canónica de los 5 Casos de Negocio

El sistema cruza la distancia vial (`distancia_km`), el tonelaje y la naturaleza del servicio para determinar el comportamiento en el Estructurador Comercial, la Asignación de Recursos, los Viajes y los Reports:

```mermaid
flowchart TD
    Inicio["Líneas de Servicio en OT"] --> Tipo{"Tipo de Servicio"}
    
    Tipo -->|Izaje Urbano <=30km| C12{"¿Lleva Contrapesos?"}
    C12 -->|No (<90T)| Caso1["CASO 1: Urbano Sin Contrapeso"]
    C12 -->|Sí (>=90T)| Caso2["CASO 2: Urbano Con Contrapeso"]
    
    Tipo -->|Izaje Rural >30km| C34{"¿Lleva Contrapesos?"}
    C34 -->|No (<90T)| Caso3["CASO 3: Rural Sin Contrapeso"]
    C34 -->|Sí (>=90T)| Caso4["CASO 4: Rural Con Contrapeso"]
    
    Tipo -->|Transporte de Terceros| Caso5["CASO 5: Flete Puro de Maquinaria"]
```

### Tabla de Comportamiento Determinista por Caso

| Atributo / Fase | CASO 1: Urbano Normal | CASO 2: Urbano c/Contrapeso | CASO 3: Rural Normal | CASO 4: Rural c/Contrapeso | CASO 5: Flete Puro |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Líneas Facturables en CRM** | 1. Arriendo Grúa (horas) | 1. Arriendo Grúa (horas)<br>2. Traslado Contrapesos ($ fijo) | 1. Arriendo Grúa (horas en obra)<br>2. Traslado Grúa ($ flete fijo) | 1. Arriendo Grúa (mín 8h)<br>2. Traslado Grúa ($ fijo)<br>3. Traslado Contrapesos ($) | 1. Flete Cama Baja ($ pactado) |
| **Filas Visibles en Asignación (Pestaña C)** | 1 Fila: Grúa Telescópica | 2 Filas:<br>• Grúa Telescópica<br>• Tracto Contrapesos | 1 Fila: Grúa Telescópica<br>*(La línea comercial Traslado Grúa se oculta)* | 2 Filas:<br>• Grúa Telescópica<br>• Tracto Contrapesos<br>*(Línea Traslado Grúa se oculta)* | 1 Fila: Camión Cama Baja |
| **Personal Asignado** | • 1 Operador Grúa<br>• (Rigger si aplica) | • 1 Operador Grúa<br>• 1 Chofer Tracto<br>• (Rigger si aplica) | • 1 Operador Grúa<br>• (Rigger si aplica) | • 1 Operador Grúa<br>• 1 Chofer Tracto<br>• (Rigger si aplica) | • 1 Chofer Cama Baja |
| **Ciclo de Hojas de Ruta (Viajes)** | • 1 Viaje Ida Grúa<br>• 1 Viaje Retorno Grúa | • Viaje Grúa (Ida/Retorno)<br>• Viaje Camión Contrapesos (Ciclo diario o desacoplado) | • Viaje Grúa (Ida/Retorno) con Odómetro y Horómetro Chasis | • Viaje Grúa (Ida/Retorno)<br>• Viaje Tracto Contrapesos (Ida/Retorno) | • Viaje Cama Baja (Origen ➔ Destino Cliente ➔ Base) |
| **Emisión de Reports Diarios de Izaje** | 1 Report Diario por día (Grúa) firmado por mandante | 1 Report Diario por día (Grúa) firmado por mandante | 1 Report Diario por día (Grúa) firmado por mandante | 1 Report Diario por día (Grúa) firmado por mandante | **CERO Reports de Izaje** (Se emite Guía de Despacho) |

---

## 4. Reglas de Desacoplamiento en la Asignación de Recursos (Pestaña C)

1. **Supresión Estricta de Fletes Autopropulsados:**  
   Cuando una línea de servicio provenga de una cotización y corresponda a `tipo === 'TRASLADO'` o `subtipo === 'FLETE_GRUA'` vinculado a un equipo autopropulsado, la interfaz de Asignación de Recursos **no debe instanciar una fila de asignación de tripulación independiente**. Dicha línea se marca internamente como `hereda_tripulacion_de: id_equipo_principal`.
2. **Inmutabilidad del Rol del Operador:**  
   Un trabajador asignado como `Operador Grúa` o `Rigger` en `tpry_rel_persona` jamás puede ser degradado o sobreescrito a `Chofer` por efectos de un ítem de traslado secundario o deduplicación de tripulación en `confirmarAsignacionOT`. El rol de faena prevalece de forma estricta.
3. **Veto Estricto de Autopropulsados en Sección 2 (`equipos_extra`):**  
   La Sección 2 de Asignación de Recursos está reservada de forma exclusiva a vehículos auxiliares de transporte (`TRACTO`, `CAMION`, `RAMPLA`, `CAMA_BAJA`, `CAMIONETA`). Queda terminantemente prohibido que una grúa autopropulsada (`subcategoria` con `GRUA`, `PLUMA`, `LTM`) o cualquier equipo ya presente en la Sección 1 (`linesEquiposPrincipales`) sea incorporado o permanezca en `equipos_extra`.
4. **Resolución Determinista de Glosas Comerciales Híbridas:**  
   Cuando una descripción comercial agrupe múltiples conceptos (ej: *"traslado de grúa 90 toneladas y contrapesos"*), el estructurador operativo descompone la instrucción:
   - El traslado de la grúa autopropulsada se reconoce como chasis propio y no genera equipo auxiliar.
   - El traslado de contrapesos genera un único registro de apoyo logístico para el tractocamión / rampla asignada.
5. **Supresión de Cama Baja Forzada en Servicios Rurales:**  
   Se elimina la asignación automática y obligatoria de camas bajas en servicios a más de 30 km para grúas autopropulsadas. Las grúas viajan por sus propios medios salvo que el equipo sea estacionario/no vial (`es_autopropulsado = false`).
6. **Equipos de Contrapeso Independientes:**  
   La línea comercial de traslado de contrapesos (`TRASLADO_CONTRAPESOS`) instancia obligatoriamente un slot de asignación vehicular donde el selector de equipos filtra exclusivamente categorías de transporte pesado (`TRACTO`, `CAMION`, `RAMPLA`, `CAMA_BAJA`) y el selector de personal filtra usuarios con rol `CHOFER_TRANSPORTE`.
7. **Validación de Equipos No Autopropulsados:**  
   Si el equipo principal asignado tiene bandera `es_autopropulsado = false` (ej. grúa sobre orugas o alzahombre de arrastre), el sistema exige obligatoriamente vincular un camión cama baja con su respectivo chofer para autorizar el paso a estado `PROGRAMADO`.

---

## 5. Ciclo de Hojas de Ruta de Viaje (`tequ_log_desplazamiento`)

Todo vehículo motorizado que transite por vía pública debe generar su registro de desplazamiento, independiente de si emite o no report diario:

### 5.1. Datos Capturados por Trayecto

| Trayecto | Evento | Instrumentos Capturados (Grúa) | Instrumentos Capturados (Camión Contrapesos / Cama Baja) |
| :--- | :--- | :--- | :--- |
| **IDA** | Salida de Patio Central GSP | Odómetro inicio, Horómetro chasis inicio, Nivel estanque combustible | Odómetro inicio, Horómetro motor inicio, Combustible |
| **IDA** | Llegada a Portería Faena | Odómetro llegada, Horómetro chasis llegada, Horómetro superestructura inicio faena | Odómetro llegada, Horómetro motor llegada |
| **RETORNO**| Salida de Faena hacia Base | Odómetro inicio retorno, Horómetro chasis retorno | Odómetro inicio retorno |
| **RETORNO**| Arribo a Patio Central GSP | Odómetro final retorno, Horómetro chasis final, Litros repostados en base | Odómetro final retorno, Combustible repostado |

### 5.2. Desacoplamiento Temporal en Servicios Multi-Día (Contrapesos)
En faenas de varios días:
- La **Grúa** realiza **1 ciclo de viaje** (Ida Día 1; pernocta en faena; Retorno Día N).
- El **Camión de Contrapesos** realiza **2 ciclos de viaje completos (4 trayectos viales)**:
  - *Ciclo 1 (Día 1):* Salida de base cargado ➔ Llegada faena ➔ Descarga de contrapesos ➔ Retorno a base vacío.
  - *Ciclo 2 (Día N):* Salida de base vacío ➔ Llegada faena ➔ Carga de contrapesos ➔ Retorno a base cargado.
El motor de viajes soporta la creación y cierre de la orden de retorno del camión sin alterar la estadía de la grúa en faena.

---

## 6. Ciclo de Reports Diarios de Faena (`tedp_reporte_avance`)

### 6.1. Regla de Concentración Documental
El cliente mandante contrata un servicio integral de izaje. Toda la operación en faena se consolida en un único documento legal y tributario: el **Report Diario de Izaje de la Grúa Principal**.

### 6.2. Declaración de Contrapesos en el Report Principal
En el formulario del Report Diario de la grúa, se incorpora una sección técnica informativa:
- Tonelaje de contrapeso utilizado en la jornada (ej: *21 Toneladas*).
- Patente del camión tracto que transportó los contrapesos (capturada automáticamente de la asignación de la OT).
- Esta información certifica al mandante la configuración de tabla de carga utilizada sin requerir una firma separada.

### 6.3. Exclusión Determinista de Camiones Auxiliares
Los camiones de contrapesos, camas bajas y camionetas escolta tienen bandera `genera_report_diario = false` en `tequ_rel_proyecto_equipo`. La PWA no generará tarjetas ni notificaciones de reports pendientes para estos vehículos, erradicando confusiones en terreno.

---

## 7. Modelo de Liquidación de Horas para Remuneraciones

La separación estricta entre Viaje y Report Diario proporciona la base matemática para la nómina de conductores y operadores:

$$\text{Horas Conducción (Art. 25 bis)} = \sum (\text{Hora Llegada Faena} - \text{Hora Salida Base}) + \sum (\text{Hora Llegada Base} - \text{Hora Salida Faena})$$

$$\text{Horas Faena Efectiva (Operador)} = (\text{Hora Término Faena} - \text{Hora Inicio Faena}) - \text{Tiempo Colación}$$

$$\text{Horas de Presencia / Stand-by} = \text{Tiempo en Obra Sin Operar por Esperas de Mandante o Clima}$$

- **Chofer de Contrapesos:** Cobra Horas de Conducción carretera + Viático de ruta + Tiempo de estiba/amarre en base y faena.
- **Operador de Grúa:** Cobra Horas de Conducción (traslado de máquina) + Horas de Faena (arriendo efectivo) + Bonificación por tonelaje de máquina operada.

---

## 8. Protocolo Operativo ante Contingencias de Terreno

1. **Pérdida de Conectividad en Ruta (Chofer no registró llegada a faena):**  
   El operador de la grúa **no está bloqueado** para iniciar el Report Diario de faena. El supervisor de operaciones puede ingresar la hora real de llegada vía *Override Administrativo* en Control en Vivo.
2. **Botón de Report Diario no avanza:**  
   El botón de avance en PWA valida en tiempo real y despliega notificaciones visibles inmediatas indicando qué dato mandatorio falta (foto de superestructura, foto de chasis o lectura horométrica).
3. **Servicio Multi-Día (Día > 1):**  
   El horómetro de inicio se hereda automáticamente del cierre de la jornada previa; el operador estampa exclusivamente la hora de inicio y queda exento de registrar viaje intermedio.
