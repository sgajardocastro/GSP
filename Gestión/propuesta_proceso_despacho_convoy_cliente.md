# 📋 Propuesta de Proceso Operacional: Modelo Integral de Despacho de Convoy, Control de Aparejos y Retorno de Faena

> **Documento:** Informe Ejecutivo y Modelo Operacional para Presentación al Cliente  
> **Destinatario:** Gerencia de Operaciones, Logística y Clientes • Grúas San Pablo (GSP)  
> **Área:** Gestión de Flota, Maniobras de Izaje y Seguridad en Faena  
> **Audiencia:** Gerencia General, Gerencia de Operaciones, Jefaturas de Patio y Clientes Mandantes  
> **Versión:** 1.0 — Enfoque de Procesos de Negocio y Logística  
> **Fecha:** 18 de Agosto de 2026  

---

## 1. Resumen Ejecutivo: La Realidad de la Operación y el Desafío Logístico

En las operaciones de izaje de alto tonelaje para minería, energía y construcción industrial, **un servicio de grúa nunca es un viaje simple de un solo camión**. 

Cada servicio requiere la movilización sincronizada de un **Convoy Operativo**:
* **Grúa Principal:** El equipo de izaje propiamente tal (móvil, telescópica o camión pluma).
* **Equipos de Transporte (Cama Baja / Ramplas):** Camiones pesados que trasladan los contrapesos masivos (hasta 40+ toneladas), plumines (JIB), almohadillas de estabilización y balancines de gran envergadura.
* **Vehículos de Apoyo / Escolta:** Camionetas que transportan a la tripulación técnica (Rigger, Prevencionista), aparejos menores de precisión y señalización de sobre-dimensión.

### 🚨 Los Dolores y Costos Reales de la Operación Actual:
1. **Faenas Paralizadas por Olvido de Implementos:** Si la grúa llega a la mina tras 3 horas de viaje y falta un balancín específico o cadenas comprometidas, la maniobra se detiene, generando multas y pérdida de confianza del cliente.
2. **Riesgo Vial por Falta de Control en el Trincaje:** La carga pesada en camas bajas (contrapesos y vigas) requiere un amarre y sujeción normativa rigurosa antes de salir a carretera.
3. **Pérdidas Económicas en el Retorno:** Al finalizar la faena, aparejos costosos (grilletes de alta capacidad, eslingas especiales) quedan olvidados o se dañan en faena sin que nadie registre el extravío oportunamente.

---

## 2. El Nuevo Modelo Operacional: Circuito Logístico Cerrado (End-to-End)

Para resolver estos desafíos, se diseña un **circuito logístico de 3 etapas interconectadas**:

```
+---------------------------------------------------------------------------------------------------+
| 1. AGUAS ARRIBA: PLANIFICACIÓN Y PLAN DE CARGA (El Origen)                                        |
| • Asignación del Convoy Completo (Grúa + Transporte + Escolta) y su Tripulación.                  |
| • Plan de Estiba (Stowage Plan): Se define exactamente qué aparejo viaja en qué camión.          |
| • Emisión automática del Manifiesto de Embarque y Despacho.                                       |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 2. EL ESLABÓN CENTRAL: PREPARACIÓN DE SALIDA & DESPACHO (En Patio)                                |
| • Inspección Pre-Uso Mecánica Ágil (90 seg por conductor en celular).                            |
| • Verificación Física de Embarque: El despachador audita que el 100% de la carga subió.           |
| • Validación de Trincaje y Amarre de Carga Pesada para Seguridad Carretera.                      |
| • Autorización de Salida y Registro de Salida del Portón (Horómetros/Odómetros).                 |
+---------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
+---------------------------------------------------------------------------------------------------+
| 3. AGUAS ABAJO: RETORNO, CONTROL DE RETORNO Y MANIFIESTO INVERSO (El Cierre)                      |
| • Inspección de Entrada: Detección y reporte inmediato de averías mecánicas para Mantenimiento.   |
| • Manifiesto Inverso de Aparejos: Contraste de [Lo que Salió] vs [Lo que Regresó a Bodega].       |
| • Detección de Daños / Descarte: Identificación de eslingas o balancines con fatiga.              |
| • Control de Extravíos: Notificación de pérdidas en obra para cobro o reposición.                 |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. Desglose Operacional por Etapa del Proceso

---

### ETAPA 1: Aguas Arriba — Planificación, Asignación y Plan de Estiba

Cuando el Coordinador de Operaciones valida la cotización y la visita a terreno, no solo asigna personas y máquinas, sino que estructura la **Logística de Carga**:

1. **Conformación del Convoy:**
   * Selección de Grúa Principal (ej. *Liebherr LTM 1220*).
   * Selección de Equipos de Transporte (ej. *Cama Baja Volvo FH 500* para contrapesos).
   * Selección de Vehículo Escolta (ej. *Toyota Hilux*).
2. **Plan de Estiba / Distribución de Aparejos (Stowage Plan):**
   * *Aparejos Pesados (Balancines de Viga, Cadenas pesadas, Canastillo)* ➔ Asignados a la **Cama Baja**.
   * *Aparejos Menores y de Precisión (Estrobos, Grilletes, Eslingas)* ➔ Asignados a la **Camioneta Escolta o Grúa**.
3. **Emisión del Manifiesto de Carga:**
   * Se genera la hoja de ruta y manifiesto que indica a Bodega y Patio qué elementos preparar para cada vehículo.

---

### ETAPA 2: El Eslabón Central — Preparación de Salida y Despacho en Patio

Antes de que el convoy abandone las instalaciones de Grúas San Pablo rumbo a la faena del cliente:

1. **Inspección Pre-Uso Mecánica (Por Conductor en Móvil):**
   * Cada conductor (de la grúa, de la cama baja y de la escolta) realiza un chequeo rápido de 90 segundos enfocado exclusivamente en la seguridad del vehículo: luces, frenos, neumáticos, niveles de fluidos, extintor, cuñas y botiquín.
2. **Torre de Control de Despacho (En Base / Patio):**
   * El Despachador de Patio audita en una sola vista que los 3 vehículos tengan su inspección mecánica aprobada.
3. **Contraste Físico de Carga de Aparejos:**
   * El despachador y el Rigger cotejan físicamente que cada aparejo comprometido en la orden esté arriba del camión correspondiente:
     * `[x] 1 Estrobo de Acero` (en Grúa)
     * `[x] 3 Grilletes Lira` (en Escolta)
     * `[x] 5 Cadenas de Izaje` (en Cama Baja)
     * `[x] 6 Balancines de Viga` (en Cama Baja)
     * `[x] 7 Canastillo Alza Hombres` (en Cama Baja)
4. **Validación de Trincaje de Seguridad Vial:**
   * Verificación obligatoria de que las cadenas de trinquete y fajas de poliéster están correctamente tensadas y bloqueadas.
5. **Apertura de Portón:**
   * Registro de hora exacta de salida, odómetros y horómetros iniciales. El convoy pasa a estado **`EN RUTA / EN FAENA`**.

---

### ETAPA 3: Aguas Abajo — Retorno a Base, Recepción y Manifiesto Inverso

Al concluir la maniobra en la obra del cliente y regresar a la base:

1. **Inspección de Llegada (Entrada a Patio):**
   * Cada conductor registra el odómetro/horómetro de retorno.
   * Se declaran eventuales averías o anomalías mecánicas ocurridas durante el trabajo, derivándose inmediatamente a Taller para mantenimiento preventivo.
2. **Manifiesto Inverso de Recepción (Bodega / Muelle de Descarga):**
   * El encargado de bodega realiza el conteo ciego de descarga:
     * *Estrobos:* Salieron 1 ➔ Regresaron 1 `[Conforme]`
     * *Grilletes:* Salieron 3 ➔ Regresaron 2 `[ALERTA: Falta 1]`
     * *Balancines:* Salieron 6 ➔ Regresaron 6 `[Conforme]`
3. **Control de Calidad, Fatiga y Descarte:**
   * Se inspecciona el estado de los elementos: si una eslinga sufrió daño por cantos vivos o una viga tuvo impacto, se envía a **Recertificación o Baja**, evitando que un elemento defectuoso salga a un próximo servicio.
4. **Gestión de Extravíos y Cobros:**
   * Si un grillete o aparejo quedó en faena, se emite automáticamente la notificación a Administración y Comercial para la reposición o cobro correspondiente.
5. **Reintegro a Stock:**
   * Los aparejos conformes se liberan inmediatamente al inventario disponible para futuros servicios.

---

## 4. Matriz Comparativa: Proceso Tradicional vs. Nuevo Modelo Operacional

| Dimensión | Proceso Tradicional (Como se hacía antes) | Nuevo Modelo Operacional GSP |
| :--- | :--- | :--- |
| **Visión del Servicio** | Monovehículo aislado (solo se miraba la grúa). | **Convoy Multiequipo Integrado** (Grúa + Transporte Cama Baja + Escolta). |
| **Checklist Pre-Uso** | Formulario genérico largo donde se mezclaban luces con balancines. | **Inspección Mecánica Ágil (90 seg)** universal para cualquier vehículo. |
| **Carga de Aparejos** | A ciegas / "A criterio del chofer" (alto riesgo de olvido). | **Manifiesto de Carga Determinístico 1 a 1** contra la orden de trabajo. |
| **Seguridad Vial en Ruta** | Sin control formal de trincaje de contrapesos. | **Auditoría de Trincaje y Amarre Normativo** previo a la salida de portón. |
| **Control de Retorno** | Informal (no se sabía si volvieron todos los grilletes). | **Manifiesto Inverso:** Trazabilidad de pérdidas, fatiga y reintegro a bodega. |

---

## 5. Propuesta de Valor y Beneficios para el Negocio

```
┌──────────────────────────────┬──────────────────────────────┬──────────────────────────────┐
│     OPERACIONAL & FAENA      │       SEGURIDAD VIAL & QA    │        FINANCIERO Y COSTOS   │
├──────────────────────────────┼──────────────────────────────┼──────────────────────────────┤
│ • Cero detenciones de faena  │ • Cumplimiento normativo de  │ • Eliminación de viajes de   │
│   por falta de aparejos.     │   trincaje en carretera.     │   emergencia por olvidos.    │
│ • Despacho matutino ágil     │ • Retiro oportuno de         │ • Reducción radical de       │
│   sin cuellos de botella.    │   aparejos con fatiga/daño.  │   mermas y pérdidas en obra. │
│ • Convoy completo validado.  │ • Trazabilidad digital total.│ • Cobro justificado de bajas.│
└──────────────────────────────┴──────────────────────────────┴──────────────────────────────┘
```

---

## 6. Conclusión y Recomendación

Este modelo no es solo un cambio de pantallas o sistemas; es la **profesionalización integral de la logística de izaje de Grúas San Pablo**, garantizando que el servicio vendido en la cotización sea exactamente el que se embarca en patio, se ejecuta con seguridad en faena y se liquida con total precisión en el retorno.
