# 📝 Minuta de Reunión: Seguimiento GSP / LeanGlobal

- **Fecha:** 17 de Agosto, 2026
- **Ámbito:** Gestión GSP / LeanGlobal – Mejoras App Móvil, Estandarización de Acuerdos Comerciales y Validación Operativa
- **Asistentes:**
  - Sergio Gajardo (LeanGlobal)
  - Jorge Ponce (`jponce@arriendosanpablo.cl` - GSP)
  - Jesús Acevedo (`jesus.acevedo.sanpablo@gmail.com` - GSP)

---

## 📌 Resumen Ejecutivo
Reunión de alineación enfocada en la optimización de la aplicación móvil (PWA de inspecciones de terreno y patio), la estandarización técnica de las condiciones comerciales (desglose independiente de viáticos/alimentación y consolidación de flags) y el establecimiento del rol del Coordinador de Operaciones como validador obligatorio de requerimientos para respaldar cobros y cobranzas. Adicionalmente, se coordinó la logística de la reunión presencial con Omar para la semana del 24 de agosto.

---

## 💬 Temas Tratados y Detalles de Discusión

### 1. Mejoras en la Aplicación Móvil (PWA) e Inspecciones de Terreno
- **Saneamiento de Cabecera:** Se eliminaron campos redundantes en los encabezados de inspección.
- **Enriquecimiento de Datos de Obra:** Se integró información explícita no disponible previamente en la vista web:
  - Nombre de la obra.
  - Dirección y ubicación técnica.
  - Datos de contacto en terreno (nombre, teléfono y correo electrónico).
- **Experiencia de Usuario e Indicadores:**
  - Incorporación de una barra/indicador de progreso visual para cuantificar el avance de respuestas cerradas en los checklists.
  - Optimización en el despliegue de fotografías y comentarios: el campo de observaciones ahora se muestra de forma condicional/dinámica solo cuando es necesario, limpiando la pantalla.

### 2. Estandarización de Acuerdos y Condiciones Comerciales
- **Consolidación de Reglas de Negocio:** Análisis de las plantillas enviadas por Jesús para clarificar la distinción entre *flags* (indicadores booleanos) y *elementos estructurales* del servicio, permitiendo que el sistema redacte automáticamente las cláusulas del PDF de cotización según lo seleccionado por el vendedor.
- **Gestión Unificada de Flags:**
  - Discusión sobre la incorporación del flag "Prevencionista Certificado".
  - Eliminación de flags redundantes ya manejados automáticamente por el motor de reportes.
  - Centralización de todos los selectores comerciales en una ubicación única dentro de `GestorOportunidades.vue` para simplificar la captura comercial.

### 3. Configuración Detallada de Viáticos, Alojamiento y Alimentación
- **Desglose de la "Pensión":** Dada la ambigüedad del término genérico de pensión, se acordó separar formalmente:
  1. **Alojamiento:** (Cubre Cliente vs. Cubre Empresa / GSP).
  2. **Alimentación:** Opciones independientes para **Desayuno**, **Almuerzo** y **Cena**, especificando pagador responsable.
- **Impacto Financiero:** Esta granularidad permitirá al Analista de Operaciones calcular con exactitud los costos operativos y proyecciones de rentabilidad.

### 4. Validación Operativa de Requerimientos y Cobranza
- **Problema Detectado:** La falta de formalidad en la captura comercial (ej. clasificación incorrecta de "Servicio Programado" vs. "On Demand / Disponibilidad") ha generado discrepancias y dificultades en el cobro posterior a clientes.
- **Acuerdo de Validación:** Se ratifica al **Coordinador de Operaciones** como validador obligatorio de los requerimientos antes de la asignación de recursos, exigiendo el llenado riguroso de condiciones para asegurar el respaldo operativo y financiero.

### 5. Planificación de Reunión Presencial (Semana del 24 de Agosto)
- **Logística:** Sergio Gajardo y Jorge Ponce coordinaron la sesión de trabajo presencial priorizando los días desde el martes 25 en adelante para asegurar la participación de Omar.
- **Plan de Viaje:** Sergio Gajardo viajará en autobús para optimizar tiempos de trabajo; Jorge Ponce confirmará la fecha exacta tras coordinar agenda con Omar.
- **Pruebas Piloto Previas:** Jorge Ponce realizará pruebas de campo con un vendedor (Richard) y el equipo de operaciones/analista para recopilar feedback antes del encuentro presencial.

---

## 🎯 Próximos Pasos & Compromisos

| Responsable | Tarea / Compromiso | Hito / Fecha Límite | Estado |
| :--- | :--- | :--- | :--- |
| **Sergio Gajardo** | Finalizar ajustes en la PWA de inspecciones de terreno y checklist de salida de patio. | 17-Ago-2026 (Hoy) | ⏳ En Progreso |
| **Sergio Gajardo** | Incorporar en Condiciones Comerciales los campos independientes de Alojamiento y Alimentación (Desayuno, Almuerzo, Cena). | Inmediato | ⏳ Pendiente |
| **Jorge Ponce** | Coordinar agenda con Omar para fijar fecha definitiva de la reunión presencial (semana del 24). | Semana del 17-Ago | ⏳ Pendiente |
| **Jorge Ponce** | Confirmar fecha exacta a Sergio Gajardo para planificación de pasajes/viaje. | Semana del 17-Ago | ⏳ Pendiente |
| **Jorge Ponce** | Ejecutar pruebas de la plataforma con equipo comercial (Richard) y operaciones/analista. | Previo a reunión 24-Ago | ⏳ Pendiente |

---

## 📅 Siguiente Hito
- **Tipo:** Reunión de Trabajo Presencial en dependencias de Grúas San Pablo.
- **Fecha Tentativa:** Semana del 24 de Agosto, 2026 (a partir del martes 25).
- **Objetivo Principal:** Demostración integral E2E del sistema con Omar, revisión de feedback de pruebas con vendedores y cierre de definiciones operativas.
