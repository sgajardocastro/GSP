# SPEC-096: Multiselección de Mecánicos con Tiempos Independientes e Impresión en Papel de Pauta de Trabajo (Mantenimiento Taller Temuco)

## 1. Metadatos y Control del Documento
- **Código de Especificación:** `SPEC-096`
- **Requerimientos Asociados:** REQ-1067 (Multiselección HH Independiente) y REQ-1068 (Pauta Impresa A4 con Tiempos)
- **Fecha:** 2026-10-23
- **Versión:** 1.0.0
- **Autor:** Sergio Gajardo (LeanGlobal)
- **Aprobado por:** **Leonel Vergara** (Jefe de Taller), **Eduardo Aguirre** (Encargado Adquisiciones/Pañol), **Jorge Ponce** (Operaciones)
- **Ambiente:** Desarrollo (`DEV`) y Producción (`PROD`)

---

## 2. Contexto Operacional y Problema a Resolver
1. **Asignación Múltiple de Mano de Obra (HH):**
   En las faenas preventivas y correctivas de Grúas San Pablo en Temuco, las intervenciones mecánicas suelen involucrar a dos o más técnicos (por ejemplo, el especialista titular liderando la tarea y uno o dos ayudantes en labores de montaje o apoyo). En la versión anterior, registrar la mano de obra exigía ingresar al modal de HH, seleccionar un mecánico, guardar y reabrir el modal para el siguiente técnico, generando fricción y lentitud. Asimismo, los técnicos no siempre dedican la misma cantidad de horas a la misma tarea.
2. **Registro de Campo en Patio y Pauta Impresa:**
   Durante la ejecución de faenas pesadas, los mecánicos trabajan con herramientas y fluidos en el patio, lo cual dificulta el uso continuo de dispositivos móviles o pantallas táctiles. **Leonel Vergara** requiere imprimir en papel físico (A4 / Carta) la ficha de la OT con la pauta de actividades, permitiendo marcar casillas con lápiz, consignar observaciones técnicas manuscritas y registrar con exactitud los tiempos de inicio (dados por el sistema) y de término real de faena.

---

## 3. Reglas de Negocio y Requerimientos Funcionales

### A. Imputación Multitécnico con Horas Independientes (REQ-1067)
- **BR-01 (Selección Múltiple Dinámica):** El usuario puede seleccionar uno o más técnicos de la nómina oficial de Taller Temuco en una sola acción.
- **BR-02 (Dedicación Horaria Independiente):** Cada técnico seleccionado dispone de su propio campo numérico editable de horas (`horas >= 0.5`), permitiendo imputaciones diferenciadas (ej. Juan Espinoza: 5.0 hrs; Claudio Morales: 2.5 hrs).
- **BR-03 (Descripción Compartida):** Se define un único campo descriptivo del trabajo realizado en conjunto por el equipo (ej: *"Cambio de mangueras de alta presión y calibración de presiones de izaje"*).
- **BR-04 (Cálculo Financiero Transparente):** El sistema calcula en tiempo real el costo individual por mecánico aplicando la tarifa horaria oficial ($15.000 CLP/hr por defecto) y muestra la suma total de HH acumuladas y monto a imputar a la OT.
- **BR-05 (Persistencia Atómica):** Al presionar *Imputar Mano de Obra*, el backend recibe la lista de técnicos y registra una fila independiente en `tmnt_ot_hh` por cada uno dentro de una única transacción `BEGIN...COMMIT`.

### B. Hoja Impresa de Actividades con Control Temporal (REQ-1068)
- **BR-06 (Control de Tiempo de Inicio - Origen Sistema):**
  La cabecera de la hoja impresa debe plasmar de forma indeleble la fecha y hora oficial de inicio registrada en el sistema (`fecha_creacion` o `fecha_programada`) junto con el horómetro/odómetro de entrada del activo.
- **BR-07 (Control de Tiempo de Término):**
  - Si la OT está **abierta o en proceso**, la hoja impresa debe renderizar un recuadro formal con casillas y líneas punteadas para que el técnico consigne a mano la fecha, hora de término real y horómetro de salida.
  - Si la OT está **cerrada**, la hoja impresa debe renderizar la fecha y hora de cierre oficial timbrada electrónicamente por el sistema con el PIN FES.
- **BR-08 (Checklist Físico y Renglones de Anotación):**
  Cada tarea del checklist debe incluir una casilla cuadrada amplia `[  ]` para chequeo manual a lápiz. Se deben incorporar renglones rayados/punteados dedicados para hallazgos y notas técnicas de taller.
- **BR-09 (Bloque de Firmas Físicas de Responsabilidad):**
  Debe incluir recuadros formales para la firma física del Mecánico Ejecutor (con nombre y RUT) y el V°B° de Jefatura de Taller (**Leonel Vergara**).
- **BR-10 (Optimización para Impresión `@media print`):**
  El diseño debe adaptarse a fondo blanco puro, ocultar barras laterales, botones y elementos oscuros, ajustándose a márgenes estándar de hoja A4.

---

## 4. Contratos de Datos y API REST

### Endpoint: `POST /api/mantenimiento/ots/:id/hh`
**Payload Extendido (Soporte Lote y Unitario):**
```json
{
  "descripcion_trabajo": "Cambio de cilindro y ajuste de torque corona",
  "fecha_trabajo": "2026-10-23",
  "tecnicos": [
    {
      "id_tecnico": 18,
      "nombre_tecnico": "Leonel Vergara",
      "rut_tecnico": "14.234.567-8",
      "horas": 4.5
    },
    {
      "id_tecnico": 72,
      "nombre_tecnico": "Juan Espinoza",
      "rut_tecnico": "12.876.543-2",
      "horas": 3.0
    }
  ]
}
```

**Respuesta Exitosa (HTTP 201 / 200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    { "id_hh": 105, "nombre_tecnico": "Leonel Vergara", "horas": 4.5, "costo_calculado": 67500 },
    { "id_hh": 106, "nombre_tecnico": "Juan Espinoza", "horas": 3.0, "costo_calculado": 45000 }
  ],
  "message": "2 imputaciones de mano de obra registradas exitosamente."
}
```

---

## 5. Diseño Visual de la Plantilla Impresa (Formato A4 - Ergonomía de Patio)

Se incorporan parámetros ergonómicos industriales diseñados específicamente para el trabajo de mecánicos con lápiz mina grueso/marcador y portapapeles en faena:
* **Casillas Checkbox Gigantes:** Dimensiones mínimas de **26px × 26px** con borde negro de 2px.
* **Tipografía Base 14px (Negro Puro):** Legibilidad optimizada para condiciones de baja iluminación o bajo chasis.
* **Cajones Amplios de Llenado:** Cajas enmarcadas de **45px de alto** para fecha, hora y horómetro de término.
* **Filas Holgadas:** Altura de **44px** por actividad de pauta.
* **Renglones Universitarios de Anotación:** Espaciado de **14mm** con líneas continuas grises para observaciones y repuestos solicitados a **Eduardo Aguirre**.
* **Zona de Firmas:** Altura libre de **80px** para trazo manual amplio.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  GRÚAS SAN PABLO                         ORDEN DE TRABAJO: MNT-2610-006     │
│  TALLER CENTRAL TEMUCO                   TIPO: PREVENTIVO  |  PRIORIDAD: P3 │
├─────────────────────────────────────────────────────────────────────────────┤
│  EQUIPO / PATENTE: TLXF.37-9 (Grúa 70 Ton LIEBHERR)    HORÓM.: 4.850,5 hrs │
│  JEFE DE TALLER:   Leonel Vergara                      MECÁNICO: Juan E.   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ⏱️ CONTROL DE TIEMPOS DE TALLER (LLENADO CON LÁPIZ)                        │
│                                                                             │
│  ▶ INICIO SISTEMA:  23/10/2026 - 08:30 hrs  | Horómetro Entrada: 4.850,5 hrs│
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ 🏁 FECHA TÉRMINO REAL: │  HORA TÉRMINO:       │ HORÓMETRO SALIDA:      │ │
│  │    ____ / ____ / 2026  │     ____ : ____ hrs  │  _________________ hrs │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  PAUTA DE ACTIVIDADES EN PATIO (MARCAR CON LÁPIZ)                           │
│                                                                             │
│  ┌────────┬─────────────────────────────────────────────────┬─────────────┐ │
│  │ CHECK  │ TAREA / ACTIVIDAD A EJECUTAR                    │ V°B° PATIO  │ │
│  ├────────┼─────────────────────────────────────────────────┼─────────────┤ │
│  │        │ 1. Inspección visual de fugas en cilindros y    │             │ │
│  │  [   ] │    mangueras hidráulicas de izaje               │   [     ]   │ │
│  │        │    (Estimado: 2.0 hrs)                          │             │ │
│  ├────────┼─────────────────────────────────────────────────┼─────────────┤ │
│  │        │ 2. Sustitución de filtros de aire y aceite      │             │ │
│  │  [   ] │    motor chasis y superestructura               │   [     ]   │ │
│  │        │    (Estimado: 1.5 hrs)                          │             │ │
│  └────────┴─────────────────────────────────────────────────┴─────────────┘ │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  OBSERVACIONES, HALLAZGOS Y REPUESTOS DE PAÑOL (ANOTACIÓN MANUAL):          │
│                                                                             │
│  1. ______________________________________________________________________  │
│                                                                             │
│  2. ______________________________________________________________________  │
│                                                                             │
│  3. ______________________________________________________________________  │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  FIRMAS FÍSICAS DE RESPONSABILIDAD:                                         │
│                                                                             │
│  ┌───────────────────────────────┐     ┌──────────────────────────────────┐ │
│  │                               │     │                                  │ │
│  │                               │     │                                  │ │
│  │ _____________________________ │     │ ________________________________ │ │
│  │ FIRMA MECÁNICO EJECUTOR       │     │ V°B° JEFATURA DE TALLER          │ │
│  │ Nombre: ..................... │     │ Leonel Vergara                   │ │
│  │ RUT:    ..................... │     │ Fecha: ____ / ____ / 2026        │ │
│  └───────────────────────────────┘     └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```


---

## 6. Actualización v1.1 (REQ-1075 / 26-Oct-2026): Compactación de Impresión de Pauta OTM a 1 Sola Página A4
- **Regla de Impresión A4 (`#printable-pauta-ot` en `MantenimientoView.vue`):** Se elimina el salto de página forzado (`page-break-before: always`) y se compactan márgenes (`@page { size: A4 portrait; margin: 7mm; }`), cabecera corporativa, grilla de triple medidor (Inicio / Término), tabla de pauta de actividades y checklists, líneas de hallazgos/observaciones en terreno, tabla de repuestos y bloque de doble firma de conformidad para que la Orden de Trabajo impresa quepa íntegramente en **1 sola hoja A4**.
