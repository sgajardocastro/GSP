# 📋 Estándar de Generación de Propuestas Formales (LeanGlobal)

Este estándar define las directrices y la estructura para crear dossiers y propuestas técnico-comerciales formales en formato web imprimible (HTML a PDF), garantizando una presentación premium, alta densidad de datos y compatibilidad perfecta de impresión.

---

## 1. Formato y Filosofía del Entregable
- **Dossier Web Autónomo (`propuesta_formal.html`)**: La propuesta formal debe ser un reporte interactivo continuo en HTML, no una presentación de diapositivas (slides).
- **Estética Editorial Clave**: Fondo de lectura claro (`#ffffff` o `#f8fafc`) con tipografía de alto contraste (Inter y Outfit) y acentos en el color corporativo del cliente (ej. amarillo seguridad `#d97706` para izajes).
- **Exportabilidad PDF Impecable**: Debe incluir una hoja de estilos de impresión (`@media print`) robusta que oculte barras de navegación, configure márgenes de 20mm y fuerce saltos de página con `page-break-before: always` para separar secciones de manera limpia.

---

## 2. Estructura Obligatoria de 11 Secciones
Cualquier propuesta formal bajo este estándar debe incluir las siguientes secciones en este orden exacto:
1.  **Portada**: Datos de contacto de las partes, logos, fecha e identificaciones fiscales (RUT/ID).
2.  **Quiénes Somos**: Presentación de LeanGlobal y experiencia de modernización y crecimiento de flotas de izaje (Caso de éxito Transmac, crecimiento de 6x en 2 años).
3.  **Proceso General de Operación y Cobertura**: Flujo del proceso físico-operativo del cliente (ej. Comercial, Ingeniería, Terreno, Cierre) y perfiles del personal técnico. Debe incluir:
    *   La tabla de **Fases Operativas vs. Intervenciones Digitales Concretas**.
    *   La **Matriz de Impacto y Cobertura Operacional** (cruce de 4 fases vs 9 características de software con indicadores dot `●` y sumatorias).
4.  **El Desafío Operativo y Financiero**: Oportunidades de mejora en el flujo de caja e introducción al concepto del **Devengado** (EBITDA, NIIF 15 y tabla contable de regímenes SII Chile).
5.  **Estructura de la Aplicación y Árbol de Navegación**: Representación jerárquica y visual en forma de árbol de carpetas/nodos (no tablas) de los módulos de la Consola Web Backoffice y las pantallas de la App Móvil.
6.  **Clientes & CRM (Flujo de Preventa)**: Explicación del registro de oportunidades, bitácora comercial, desgloses de servicios, API bidireccionales con Laudus ERP y la matriz de riesgo de integración con Laudus.
7.  **Gestor Documental GSP (Biblioteca Centralizada)**: Repositorio centralizado de expedientes legales de grúas (certificaciones Bureau Veritas, seguros, permisos viales MOP) y expedientes operativos de terreno (checklists, ASTs, firmas).
8.  **Principales Pantallas (Visuales)**: Imágenes reales capturadas del prototipo web incrustadas con explicaciones breves. Requisitos indispensables:
    *   *Dashboard*: Debe mostrar el histograma y gráficos de barras renderizados por completo.
    *   *Torre de Control*: Debe mostrar 3 imágenes representando la vista Kanban, la perspectiva geográfica (Mapa GPS) y la perspectiva temporal (Gantt de Flota).
    *   *Expediente 360°*: Debe mostrar la pestaña activa de **Ingeniería & Site Visit** (utilización de grúa, suelo, contrapesos) recortada sin fondos negros que resten espacio.
    *   *CRM*: Debe mostrar el drawer del Gestor de Oportunidades abierto y recortado.
    *   *Gestor Documental*: Debe mostrar la interfaz de biblioteca unificada con el árbol de directorios a la izquierda y la lista de archivos a la derecha.
    *   *App Móvil*: Secuencia horizontal de pantallas (Inbox y AST/Checklist) en marcos de smartphone recortados.
    *   *Flota*: Ficha 360° de maquinaria (ej. Liebherr LTM 1400) abierta y recortada.
9.  **Seguridad y Arquitectura en la Nube (GCP)**: Alojamiento en Google Cloud Platform, encriptación, y alineamiento con la **Ley Marco de Ciberseguridad de Chile (Diciembre 2026)**.
10. **Cronograma e Hitos**: Fases de desarrollo e implementación (plazo sugerido de 10 semanas).
11. **Oferta Comercial & Soporte**: Tabla detallada de costos de licenciamiento SaaS mensual, desarrollo inicial de API/cotizador, capacitaciones y acuerdo de niveles de soporte (SLA).

---

## 3. Automatización de Capturas (Mockup screenshots)
Para ilustrar la Sección 8, se debe implementar un script Puppeteer (`capturar_pantallas.mjs`) que:
1.  Levante la maqueta del producto o abra el archivo local.
2.  Interactúe con el DOM para cambiar roles, pestañas de modales o vistas temporales/geográficas.
3.  Tome capturas enfocadas y recortadas de los elementos modales (`.modal-content` o `.mobile-frame`) para evitar fondos negros y cometer fallas visuales.
4.  Almacene localmente en `assets/` para que la propuesta las cargue directamente de forma offline.
