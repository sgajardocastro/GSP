# 📝 Minuta de Reunión: Seguimiento y Gestión — Pruebas en Paralelo, Roles Comerciales, Acreditación Empresa y Estrategia de Mantenimiento

**Fecha:** 2026-09-21  
**Participantes:**  
*   **Jorge Ponce** (Gerente General - Grúas San Pablo - `jponce@arriendosanpablo.cl`)  
*   **Sergio Gajardo** (Líder de Proyecto - LeanGlobal - `sgajardoc@gmail.com`)  

**Enlaces y Registros:**  
*   [Evento de Calendario](https://calendar.google.com/calendar/event?eid=NmxrcmNkcW1oc2E3ZDU4MXVnZWtkcmozaWxfMjAyNjA5MjFUMTQwMDAwWiBzZ2FqYXJkb2NAbQ)  
*   [Transcripción Oficial](https://docs.google.com/document/d/1TkBK36xszwa-jdq9H7CAyeXF6rFahhJa5kx1idD1__w/edit?usp=drive_web&tab=t.p1b6sasotgj0)  

---

## 🎯 Resumen Ejecutivo

Revisión operacional y pruebas del sistema con foco en la planificación comercial, impacto de las festividades de septiembre, definición de roles comerciales, cronograma de carga de documentación institucional por empresa y priorización de la estrategia de mantenimiento sobre inventario físico. Se ratifica la versión oficial para puesta en marcha en octubre con marcha blanca en paralelo.

---

## ✅ Decisiones y Acuerdos Principales

### 1. Impacto Fiestas Patrias y Calendario de Pruebas
*   Las festividades de septiembre afectaron el ritmo productivo habitual.
*   Se ajusta el calendario para ejecutar pruebas intensivas de marcha blanca durante los últimos días de septiembre, proyectando la **versión oficial operativa durante octubre**.

### 2. Marcha Blanca y Pruebas en Paralelo
*   **Pruebas en Paralelo:** Wilson y Natalia operarán simultáneamente en el sistema actual (Geralsoft / planillas) y en la nueva plataforma web de LeanGlobal.
*   **Control de Salida Flexible:** La inspección de salida de patio no será bloqueante en esta primera etapa de pruebas para no interrumpir el flujo del servicio en faena.

### 3. Roles Comerciales y Restricción de Edición
*   Se define la regla de seguridad y privacidad comercial: cada ejecutiva/o comercial solo podrá visualizar y editar las cotizaciones creadas por sí misma/o, evitando alteraciones cruzadas entre ejecutivos.

### 4. Carga de Documentación Institucional de Empresa (Opción A)
*   Dayana asumirá la responsabilidad de cargar y actualizar durante la semana la documentación legal, tributaria y laboral de las 4 empresas hermanas:
    *   Certificados F30-1 (Cumplimiento de obligaciones laborales y previsionales).
    *   Certificados de Siniestralidad y Afiliación a Mutualidad.
    *   Carpeta Tributaria Electrónica (SII).
    *   Reglamento Interno de Orden, Higiene y Seguridad (RIOHS) y políticas corporativas.
*   Se implementa la interfaz de gestión directa en la Dimensión 1 de Documentos (`Documentos.vue`) con selector de empresa, subida de PDF y fecha de vencimiento.

### 5. Enrolamiento de Usuarios Clave
*   Jorge Ponce proporcionará los datos de contacto y antecedentes para enrolar en marcha blanca a:
    *   **Wilson** (Ventas / Comercial)
    *   **Yara** (Ventas / Comercial)
    *   **Marita** (Contabilidad / DTE / Facturación)
    *   **Dayana** (Prevención / Acreditación)

### 6. Estrategia Técnica: Mantenimiento Primero, Inventario Después (Spec 48)
*   Se ratifica desacoplar el WMS físico en esta etapa: partir implementando las **Órdenes de Trabajo (OT) de Mantenimiento** vinculadas a los 110 equipos ya existentes en `tequ_equipo`, integradas con la Torre de Control y Gantt de Disponibilidad.
*   El control físico de pañol, bodegas y etiquetado QR térmico de repuestos se abordará de forma modular una vez estabilizado el ciclo de OTs y taller.

---

## 📋 Próximos Pasos y Asignación de Tareas

### Sergio Gajardo (LeanGlobal)
- [ ] Habilitar en `Documentos.vue` la interfaz de carga y actualización de documentos institucionales de empresa (Opción A).
- [ ] Ejecutar el enrolamiento y asignación de roles para Wilson, Yara, Marita y Dayana.
- [ ] Ajustar permisos comerciales para restricción de edición por creador de cotización.
- [ ] Avanzar en la estructura de Mantenimiento OTs (Spec 48) priorizando actividades, HH, servicios externos y cierre con PIN.

### Jorge Ponce (Grúas San Pablo)
- [ ] Enviar la nómina con RUT, nombres, correos y cargos para el enrolamiento de Wilson, Yara, Marita y Dayana.
- [ ] Coordinar y supervisar a Dayana para la carga de los F30-1 y carpetas tributarias de las 4 empresas.
- [ ] Instruir a Wilson y Natalia para el inicio de cotizaciones en paralelo en la nueva consola.
