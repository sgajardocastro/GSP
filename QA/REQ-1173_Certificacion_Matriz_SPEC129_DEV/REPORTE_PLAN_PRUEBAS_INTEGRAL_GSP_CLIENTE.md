# INFORME MAESTRO DE PLAN DE PRUEBAS INTEGRALES Y CERTIFICACIÓN E2E
## Homologación de Incidentes de Producción, Matriz Unitaria por Línea y Casos Híbridos Multilínea (SPEC-129 / SPEC-130)

---

| Metadato Corporativo | Detalle de Control y Auditoría |
|---|---|
| **Ecosistema de Software** | LeanGlobal Platform / Solución Vertical: Grúas San Pablo (GSP) |
| **Cliente Mandante** | Grúas San Pablo SpA |
| **Destinatarios Oficiales** | Jorge Ponce (Gerente General), Alfonso Porperrello (Product Manager / Key User) y Equipo Directivo GSP |
| **Ambiente de Certificación** | Entorno DEV Oficial (`https://servidor.leanglobal.cl/lg-gsp-dev/` \| Esquema BD `sch_leangsp`) |
| **Fecha de Emisión** | 15 de Noviembre de 2026 |
| **Auditor Líder QA** | Subagente Especialista en Certificación de Ciclo Completo de Negocio (QA Business Specialist) |
| **Veredicto Financiero y Operacional** | **100% CERTIFICADO — CERO DESCUADRES ($0 CLP DE DISCREPANCIA)** |

---

## 1. Carta Ejecutiva y Alcance de la Certificación

Estimados Jorge y Alfonso,

El presente informe consolida el **Plan Maestro de Pruebas Integrales End-to-End (E2E)** ejecutado sobre la plataforma Grúas San Pablo (GSP), tras la implementación de la nueva arquitectura de **Árbol de Servicios, Asignación Atómica y Arriendos Multidía (SPEC-129 y SPEC-130)**.

Para garantizar total transparencia técnica y certidumbre operativa a la gerencia, todas las pruebas han sido ejecutadas **100% en vivo a través de los endpoints oficiales de la API REST y las interfaces PWA/Web**, sin inserciones sintéticas por base de datos, auditando la **consistencia triangular exacta (Pantallas Web/Móvil = API Backend = Documentos Legales Oficiales en PDF)**.

El plan de pruebas se estructura de forma transparente y sin omisiones en **tres grandes categorías complementarias**:

```
                       ARQUITECTURA DE VALIDACIÓN INTEGRAL GSP (3 NIVELES)
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                                         │
│  [CATEGORÍA 1: INCIDENTES REALES]         [CATEGORÍA 2: MATRIZ UNITARIA]        [CATEGORÍA 3: HÍBRIDOS] │
│  Homologación estricta de los 8 tickets   33 casos atómicos probados de forma   Demostración de proyectos │
│  históricos de soporte en producción      aislada por línea de servicio:        multilínea bajo un solo   │
│  (Barthou, Mettco, Pocuro, Royal, etc.)   - 9 Bloqueos Gate Negativo (HTTP 400) contrato/EDP (SPEC-129)   │
│  Resueltos de fondo y cuadrados a $0 CLP. - 24 Modalidades Positivas aprobadas. (Izaje + Rental + Fletes)│
│                                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Resumen Ejecutivo de Resultados por Categoría

| Categoría de Validación | Universo Evaluado | Casos Exitosos | Casos Fallidos | Descuadre Máximo CLP | Veredicto |
|---|:---:|:---:|:---:|:---:|:---:|
| **Categoría 1: Homologación Incidentes Reales (`Soporte/`)** | 8 Incidentes Reales | 8 | 0 | **$0 CLP** | **PASS (100%)** |
| **Categoría 2.1: Gate Negativo Determinista (Casos Bloqueados)** | 9 Reglas Inválidas | 9 (HTTP 400) | 0 | **$0 CLP** | **PASS (100%)** |
| **Categoría 2.2: Matriz Unitaria Positiva por Línea de Negocio** | 24 Modalidades | 24 | 0 | **$0 CLP** | **PASS (100%)** |
| **Categoría 3: Proyectos Híbridos Multilínea (SPEC-129)** | 4 Proyectos Complejos | 4 | 0 | **$0 CLP** | **PASS (100%)** |
| **TOTAL GENERAL AUDITADO** | **45 Pruebas Integrales** | **45** | **0** | **$0 CLP** | **PASS (100%)** |

---

## 3. CATEGORÍA 1: Homologación de Incidentes Reales de Producción (`Soporte/`)

Esta categoría demuestra cómo cada uno de los problemas históricos reportados por los usuarios en faenas reales de producción ha sido **resuelto de raíz (Resolución de Fondo / Cero Parches)**, auditado contra los registros de auditoría y certificado con diferencia de **$0 CLP** entre el devengo operativo y la facturación al mandante.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TABLA DE HOMOLOGACIÓN: INCIDENTES DE SOPORTE VS SOLUCIÓN ESTRUCTURAL Y TESTIGO DEV                      │
├─────────────────────┬───────────────────┬──────────────────────────────────────────┬────────────────────┤
│ Ticket de Soporte   │ Cliente / Faena   │ Causa Raíz Detectada y Resuelta          │ Testigo Vivo DEV   │
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-01    │ Constructora      │ Regla de Suma Alzada inmutable ($1.000k).│ ID 168 / ID 139    │
│                     │ Barthou / Rosen   │ Camioneta de apoyo $0 no infla tarifa.   │ $1.000.000 ($0 dif)│
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-02    │ METTCO SpA        │ Faena 5 días consecutivos (40h mínimas). │ ID 151             │
│                     │ Planta Ferrero    │ Relevo de operador y contingencia viento.│ $4.950.000 ($0 dif)│
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-03    │ Constructora      │ Grúa 8h ($1.280k) + Traslado ($200k) +   │ ID 169             │
│                     │ Pocuro            │ Rigger ($200k) + Balancín $0 = $1.680k.  │ $1.680.000 ($0 dif)│
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-04    │ Royal Rental      │ Liquidación Rental 360°: Arriendo mes +  │ ID 172             │
│                     │ Faena Osorno      │ Diésel faltante ($40.5k) + Daños ($263.5k│ $2.154.000 ($0 dif)│
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-05    │ Royal Fletes      │ Consolidación de flete ida y vuelta en   │ ID 172 / ID 183    │
│                     │ Maquinaria        │ 1 sola línea de cobro único ($250.000).  │ Flete Consolidado  │
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-06    │ Inmobiliaria      │ Solo-Staff Rigger sin grúa ($300.000).   │ ID 175             │
│                     │ Plaenge           │ Cero reports de grúa requeridos.         │ $300.000 ($0 dif)  │
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-07    │ Besalco           │ Ajustes de Control de Gestión y Descuento│ ID 177             │
│                     │ Montajes          │ Tesorería auditados con trazabilidad.    │ $1.680.000 ($0 dif)│
├─────────────────────┼───────────────────┼──────────────────────────────────────────┼────────────────────┤
│ CASO-20261114-08    │ Defecto ITS Web   │ Desvío de cálculo en navegador saneado.  │ Unificación Motor  │
│                     │ Saneamiento Motor │ Frontend ahora consume motor relacional. │ 100% Homologado    │
└─────────────────────┴───────────────────┴──────────────────────────────────────────┴────────────────────┘
```

### Detalle del Caso Testigo Dorado: METTCO SpA (Ferrero 5 Días) — ID 151
- **Enlace Directo Torre/CRM:** [Ver Proyecto ID 151 en DEV](https://servidor.leanglobal.cl/lg-gsp-dev/crm?id=151)
- **Folio OT:** `GSP-2611-00096` | **Monto Facturado:** `$4.950.000 CLP`
- **Operación Real Certificada:**
  - 5 días consecutivos de faena en Coronel con Grúa 70T (ID 39) y Rigger (ID 38).
  - Operador titular Claudio Gallardo (Día 1 y Día 2, 8 hrs c/u).
  - **Relevo en faena** por operador Ernesto Ríos (Día 3 a Día 5, 8 hrs c/u).
  - **Día 3 con contingencia climática (ráfagas de viento):** Se aplicó el Acuerdo #7 de parada justificada por seguridad con V°B° del ITO mandante, liquidando el piso mínimo de 8 horas sin castigo financiero.
  - Carátula de Estado de Pago oficial consolidó exactamente:
    - 40 horas mínimas garantizadas de Grúa @ $115.000/hr = **$4.600.000 CLP**.
    - Traslado Ida y Retorno Rural = **$350.000 CLP**.
    - Rigger incluido en faena = **$0 CLP**.
    - **Total Estado de Pago:** **$4.950.000 CLP (Diferencia: $0 CLP)**.

---

## 4. CATEGORÍA 2: Pruebas Unitarias Atómicas por Línea de Servicio (33 Casos SPEC-129)

Para dar absoluta certeza de que cada modalidad comercial funciona de manera aislada antes de combinarse, se validaron los **33 casos de la Matriz de Negocio GSP**:

### 4.1 Subgrupo Gate Negativo Determinista (9 Casos Bloqueados — HTTP 400 Bad Request)
La plataforma dispone de candados lógicos estrictos en el backend que **impiden guardar cotizaciones, emitir OTs o cerrar estados de pago** si se intentan utilizar modalidades declaradas expresamente como no comercializables por GSP:

1. **Caso 1.4 (Grúa Fijo Semanal):** Bloqueado. Grúas solo se cotizan por hora o suma alzada.
2. **Caso 1.6 (Grúa Fijo Mensual Sin Horas):** Bloqueado. Exige bolsa de horas con piso mínimo.
3. **Caso 2.2 (Rental Dry-Lease Semanal):** Bloqueado. Rental opera exclusivamente diario o mensual.
4. **Caso 2.4 (Rental Bolsa Horas Mes):** Bloqueado. Las plataformas se arriendan por canon temporal, no por horómetro.
5. **Caso 3.2 (Transporte por Kilómetro):** Bloqueado. GSP comercializa fletes por viaje plano (Ida/Vuelta).
6. **Caso 3.5 (Sobreestadía Camión por Horas):** Bloqueado. No se cobran esperas fraccionadas.
7. **Caso 4.3 (Profesional Horas Diarias Piso 8h):** Bloqueado. Personal se arrienda por jornada o suma alzada.
8. **Caso 4.5 (Profesional Valor Fijo Semanal):** Bloqueado.
9. **Caso 4.7 (Estudio de Rigging como Nodo Rígido Autónomo):** Bloqueado. El estudio de maniobras se incluye como costo técnico o suma alzada, nunca como equipo ejecutor.

### 4.2 Subgrupo Pruebas Unitarias Positivas (24 Modalidades Certificadas)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ RESUMEN DE LAS 24 MODALIDADES UNITARIAS POSITIVAS CERTIFICADAS A $0 CLP                                  │
├─────────┬──────────────┬───────────────────────────────────────────────┬────────────────┬───────────────┤
│ N° Caso │ Línea Negocio│ Descripción de la Modalidad Cotizada          │ Testigo DEV    │ Estado QA     │
├─────────┼──────────────┼───────────────────────────────────────────────┼────────────────┼───────────────┤
│ 1.0     │ IZAJE        │ Grúa Turno Único Estándar Piso 8h Urbano      │ ID 168 / ID 170│ CERTIFICADO   │
│ 1.1.M   │ IZAJE        │ Grúa Horas a Disposición Flexible Multidía    │ ID 151         │ CERTIFICADO   │
│ 1.2     │ IZAJE        │ Maniobra Suma Alzada Inmutable $1.000.000     │ ID 168 (ARQ-01)│ CERTIFICADO   │
│ 1.3     │ IZAJE        │ Grúa Valor Fijo Diario (Jornada Faena)        │ ID 170 (ARQ-03)│ CERTIFICADO   │
│ 1.5.M   │ IZAJE        │ Bolsa Mensual 150h/180h con sobretiempo       │ ID 171 (ARQ-04)│ CERTIFICADO   │
│ 1.7.M   │ IZAJE        │ Traslado Grúa Autopropulsada Ida y Retorno    │ ID 151 / ID 169│ CERTIFICADO   │
│ 1.8.M   │ IZAJE        │ Traslado Maquinaria en Cama Baja Especial     │ ID 174 (ARQ-07)│ CERTIFICADO   │
│ 1.9.M   │ IZAJE        │ Rigger Incluido en Cuadrilla ($0 al Cliente)  │ ID 151 / ID 169│ CERTIFICADO   │
│ 1.10.M  │ IZAJE        │ Accesorio Balancín / Maniobra Especial        │ ID 169 (ARQ-02)│ CERTIFICADO   │
│ 1.11.M  │ IZAJE        │ Camioneta de Apoyo ($0 Mandante, Costo GSP)   │ ID 168 (ARQ-01)│ CERTIFICADO   │
│ 2.1.M   │ RENTAL       │ Plataforma Tijera / Articulada Diario         │ ID 173 (ARQ-06)│ CERTIFICADO   │
│ 2.3.M   │ RENTAL       │ Plataforma Arriendo Mensual Horas Libres      │ ID 172 (ARQ-05)│ CERTIFICADO   │
│ 2.5.M   │ RENTAL       │ Flete Entrega en Obra (Ida)                   │ ID 172 (ARQ-05)│ CERTIFICADO   │
│ 2.6.M   │ RENTAL       │ Flete Retiro desde Obra (Vuelta Asíncrono)    │ ID 172 (ARQ-05)│ CERTIFICADO   │
│ 2.7.M   │ RENTAL       │ Liquidación 360° Diésel y Daños con Fotos     │ ID 172 (ARQ-05)│ CERTIFICADO   │
│ 3.1.M   │ TRANSPORTE   │ Flete Cama Baja / Rampla Puro (Cero Grúa)     │ ID 174 (ARQ-07)│ CERTIFICADO   │
│ 3.3     │ TRANSPORTE   │ Camión por Jornada a Disposición              │ ID 174 (ARQ-07)│ CERTIFICADO   │
│ 3.4     │ TRANSPORTE   │ Camioneta Escolta Permisos Vialidad MOP       │ ID 174 (ARQ-07)│ CERTIFICADO   │
│ 4.1     │ PROFESIONAL  │ Profesional Solo-Staff Rigger Suma Alzada     │ ID 175 (ARQ-08)│ CERTIFICADO   │
│ 4.2     │ PROFESIONAL  │ Profesional Rigger por Día Completo en Faena  │ ID 175 (ARQ-08)│ CERTIFICADO   │
│ 4.4     │ PROFESIONAL  │ Profesional Hora Efectiva de Inspección       │ ID 175 (ARQ-08)│ CERTIFICADO   │
│ 4.6     │ PROFESIONAL  │ Profesional Dotación Mensual Dedicada         │ ID 175 (ARQ-08)│ CERTIFICADO   │
│ 4.8.M   │ PROFESIONAL  │ Movilización Personal / Viáticos Pestaña Otros│ ID 169 (ARQ-02)│ CERTIFICADO   │
│ 5.0     │ INTERNAS     │ Movimiento Flota entre Bases Taller ($0 CLP)  │ ID 176 (ARQ-09)│ CERTIFICADO   │
└─────────┴──────────────┴───────────────────────────────────────────────┴────────────────┴───────────────┘
```

---

## 5. CATEGORÍA 3: Casos Híbridos Multilínea (El Árbol Comercial SPEC-129)

La mayor fortaleza de la nueva especificación comercial **SPEC-129** radica en la capacidad de cotizar, asignar recursos y liquidar en un **único contrato y Estado de Pago** múltiples líneas de negocio combinadas. 

Para demostrar esta capacidad a la gerencia, se certificaron 4 proyectos híbridos de alta complejidad:

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ RESUMEN DE PROYECTOS HÍBRIDOS MULTILÍNEA CERTIFICADOS EN DEV                                            │
├──────────┬───────────────────────────────┬──────────────┬──────────────┬──────────────┬─────────────────┤
│ Código   │ Combinación Multilínea        │ Cotizado     │ Facturado EDP│ Diferencia   │ Estado          │
├──────────┼───────────────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────┤
│ HIB-01   │ IZAJE + RENTAL                │ $1.620.000   │ $1.620.000   │ $0 CLP       │ PASS (100%)     │
│          │ Grúa 70T (8h) + Tijera (3d)   │              │              │              │                 │
├──────────┼───────────────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────┤
│ HIB-02   │ IZAJE + PROFESIONAL           │ $1.700.000   │ $1.700.000   │ $0 CLP       │ PASS (100%)     │
│          │ Grúa 100T Alzada + Supervisor │              │              │              │                 │
├──────────┼───────────────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────┤
│ HIB-03   │ RENTAL + TRANSPORTE           │ $3.450.000   │ $3.450.000   │ $0 CLP       │ PASS (100%)     │
│          │ 2 Tijeras Mes + Cama Baja     │              │              │              │                 │
├──────────┼───────────────────────────────┼──────────────┼──────────────┼──────────────┼─────────────────┤
│ HIB-04   │ PARADA PLANTA INTEGRAL 360°   │ $2.860.000   │ $2.860.000   │ $0 CLP       │ PASS (100%)     │
│          │ Izaje + Rental + Flete + Staff│              │              │              │                 │
└──────────┴───────────────────────────────┴──────────────┴──────────────┴──────────────┴─────────────────┘
```

### Detalle Arquitectónico de los Casos Híbridos:

#### Caso HIB-01: Izaje de Grúa 70 Ton + Arriendo de Plataforma Tijera (3 Días)
- **Desafío Operativo:** Una obra industrial requiere una grúa telescópica durante 1 día para montar cerchas pesadas, y simultáneamente arrienda una plataforma tijera por 3 días para trabajos de fijación en altura.
- **Resolución en Plataforma:**
  - Línea 1 (Grúa 70T): $880.000 CLP (liquidada con 1 report diario de operador en faena).
  - Línea 2 (Traslado Grúa): $350.000 CLP (cobro único).
  - Línea 3 (Plataforma Tijera Rental): $70.000/día × 3 días = **$210.000 CLP** (liquidada con Actas de Entrega y Devolución 360°, sin exigir reports diarios de operador).
  - Línea 4 (Flete Cama Baja Tijera): $180.000 CLP.
  - **Liquidación en Carátula EDP PDF:** **$1.620.000 CLP exactos ($0 diferencia)**.

#### Caso HIB-02: Izaje Suma Alzada + Profesional Dedicado (Supervisor Rigging)
- **Desafío Operativo:** Faena de montaje crítico donde se pacta la grúa a suma alzada inmutable ($1.200.000) y se contrata a un Supervisor de Maniobras por 2 días completos ($250.000/día = $500.000).
- **Resolución en Plataforma:**
  - El sistema devenga la grúa a valor fijo indivisible ($1.200.000) y devenga los 2 días del profesional sin requerir patentes de maquinaria para el supervisor.
  - **Total Estado de Pago PDF:** **$1.700.000 CLP ($0 diferencia)**.

#### Caso HIB-03: Rental de 2 Plataformas Mensuales + Transporte Especial
- **Desafío Operativo:** Arriendo mensual de 2 plataformas articuladas ($1.400.000 c/u = $2.800.000) más movilización en cama baja ($650.000).
- **Resolución en Plataforma:**
  - Emisión de Contrato de Arriendo oficial en PDF y liquidación bajo canon mensual con horas libres.
  - **Total Estado de Pago PDF:** **$3.450.000 CLP ($0 diferencia)**.

#### Caso HIB-04: Parada de Planta Mayor 360° (4 Líneas Combinadas)
- **Desafío Operativo:** Parada mayor de planta celulosa/industrial que integra todas las líneas de la empresa:
  - Izaje: Grúa 70T por 2 jornadas (16 hrs mínimas @ $110.000 = $1.760.000).
  - Rental: Plataforma Tijera por 5 días (@ $70.000 = $350.000).
  - Transporte: Cama baja para traslado de equipos ($450.000).
  - Profesional: Rigger Staff certificado suma alzada ($300.000).
- **Resolución en Plataforma:**
  - La grúa emitió sus 2 reports diarios correlativos en PWA (Día 1 y Día 2).
  - La tijera se liquidó con su período de arriendo de 5 días.
  - El transporte y el profesional se integraron en el mismo estado de pago.
  - **Total Estado de Pago PDF:** **$2.860.000 CLP ($0 diferencia)**.

---

## 6. Auditoría de Consistencia Triangular y Evidencias Físicas

Cada uno de los casos cuenta con su respaldo documental generado por los motores oficiales del backend y archivado en el repositorio de auditoría:

```
Directorio Físico de Evidencias:
QA/REQ-1173_Certificacion_Matriz_SPEC129_DEV/evidencia/pdfs/

Documentos Clave Disponibles para Revisión:
├── Mettco 5 Días (ID 151):   EDP_151_GSP-2611-00096.pdf ($4.950.000 CLP)
├── Barthou Alzada (ID 168):  ARQ01_EDP_168.pdf ($1.000.000 CLP)
├── Pocuro Mixto (ID 169):    ARQ02_EDP_169.pdf ($1.680.000 CLP)
├── Royal Rental (ID 172):    ARQ05_EDP_172.pdf ($2.154.000 CLP)
├── Besalco Ajustes (ID 177): ARQ10_EDP_177.pdf ($1.680.000 CLP)
├── Híbrido 01 (ID 186):      HIB01_EDP_186.pdf ($1.620.000 CLP)
├── Híbrido 02 (ID 187):      HIB02_EDP_187.pdf ($1.700.000 CLP)
├── Híbrido 03 (ID 188):      HIB03_EDP_188.pdf ($3.450.000 CLP)
└── Híbrido 04 (ID 189):      HIB04_EDP_189.pdf ($2.860.000 CLP)
```

---

## 7. Dictamen Final y Conclusión para Gerencia

La arquitectura comercial y operativa implementada bajo **SPEC-129 y SPEC-130**:
1. **Elimina de raíz los descuadres financieros históricos**, garantizando que lo cotizado en preventa coincida al 100% con lo operado en faena y lo facturado en el Estado de Pago.
2. **Protege a la empresa ante contingencias operacionales**, como sobretiempos, relevos de personal o detenciones por viento, liquidando las horas con estricta sujeción a las cláusulas comerciales pactadas.
3. **Otorga flexibilidad absoluta para proyectos multilínea**, permitiendo comercializar paquetes de izaje, arriendo de maquinaria, fletes y personal especializado en un único documento profesional para los clientes más exigentes del país (Besalco, Mettco, Plaenge, Rosen).

**Dictamen:** **SISTEMA 100% CERTIFICADO Y APTO PARA DESPLIEGUE A PRODUCCIÓN.**
