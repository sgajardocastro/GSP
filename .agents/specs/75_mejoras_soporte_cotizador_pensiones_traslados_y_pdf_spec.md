# Especificación 75: Mejoras de Soporte en Cotizador Comercial y Documento PDF

## 📌 Contexto y Origen del Requerimiento
A partir de la sesión de soporte y marcha blanca realizada entre Gerencia de Operaciones (Jorge Ponce) y Dirección Tecnológica (Sergio Gajardo), con la incorporación del nuevo Jefe de Operaciones (Jonathan) y simulación de arriendo de plataformas para Royal Rental, se identificaron bloqueos operativos y discrepancias visuales en el flujo de cotización comercial y emisión de documentos PDF.

---

## 🎯 Objetivos de la Especificación
1. **TSK-SOP-01 (Liberación de Edición de Pensiones en Servicios de 1 Día):** Permitir al comercial definir libremente las condiciones de alimentación (desayuno, almuerzo, cena, traslado) independientemente de la duración del servicio (eliminando el bloqueo estricto en servicios de 1 día).
2. **TSK-SOP-02 (Categoría Camión Plataforma en Traslados):** Añadir la subcategoría `CAMIÓN PLATAFORMA` al selector de traslados/fletes para alzahombres y maquinaria liviana.
3. **TSK-SOP-03 (Supresión de Autocompletado del Navegador en Datos del Cliente):** Implementar supresores de autocompletado en los inputs de búsqueda de cliente y captura de teléfonos para evitar sobreescritura de datos al tipear.
4. **TSK-COT-01 (Datos del Ejecutivo Comercial en Cotización PDF):** Mostrar el nombre y teléfono directo del ejecutivo responsable de la cotización en la cabecera del PDF oficial.
5. **TSK-COT-02 (Resolución Paramétrica de Empresa Emisora en PDF):** Resolver la empresa emisora en base a la columna relacional `p.id_empresa` de `tpry_proyecto`, evitando que por defecto se fije "Luis Omar Ghisellini" cuando se coticen proyectos bajo otras razones sociales (como Royal Rental, Bestmaq o San Pablo).
6. **TSK-COT-03 (Supresión de Cláusula de Régimen Urbano en Caso 5):** Ocultar la cláusula contractual de régimen urbano/rural cuando el servicio se configure bajo el Caso 5 (Partidas Abiertas / Plataformas Alzahombres).

---

## 🏗️ Diseño Técnico de Componentes

### 1. Frontend: `GestorOportunidades.vue`
- **Pensiones / Viáticos:** Eliminar clases `opacity-50 pointer-events-none select-none` y deshabilitación en `v-model` de `comercial.pensiones.*`. Eliminar la sobreescritura forzada a `'NA'` en el watcher de fechas y en la hidratación inicial.
- **Categorías de Traslado:** Añadir `{ id_subcategoria: 905, nombre_subcategoria: 'CAMIÓN PLATAFORMA' }` en `upsertCat(99, 'TRASLADOS', ...)`.
- **Inputs de Cliente:** Añadir `autocomplete="new-password"`, `data-lpignore="true"` y atributos semánticos únicos `name="crm_contacto_..."`.

### 2. Backend: `proyectoModel.js` (`generarCotizacionVersion`)
- **Empresa Emisora:** Leer `idEmisora = Number(p.id_empresa || p.id_empresa_emisora || 9)` y consultar `tpar_empresas` para obtener razón social, RUT, dirección y logotipo.
- **Ejecutivo Comercial:** Consultar `tsec_users` mediante `p.id_user || p.id_usuario_creacion` y cruzar con `crm.vendedor_nombre` / `crm.vendedor_telefono`. Inyectar en `quote-meta` del PDF.
- **Régimen Operacional:** Evaluar `esCaso5 = Number(crm.tipo_caso) === 5 || crm.tipo_caso_glosa === 'ESPECIAL_MIXTO_LIBRE'`. Si es verdadero, omitir la cláusula contractual de régimen urbano y desplegar en la tabla resumen `ESPECIAL / PLATAFORMAS (Partidas Abiertas)`.

---

## ✅ Criterios de Aceptación y Verificación
- En servicios de 1 día, el comercial puede seleccionar "Costeado por Cliente" o "Costeado por San Pablo" en alimentación sin bloqueos.
- El dropdown de traslados despliega "CAMIÓN PLATAFORMA".
- Al tipear en el campo de teléfono, Chrome no borra el contenido ni duplica texto.
- Al generar el PDF de una cotización de Royal Rental, el encabezado muestra los datos de la empresa emisora correspondiente y el nombre del ejecutivo responsable con su teléfono.
- En cotizaciones configuradas con Caso 5, no aparece la cláusula "• RÉGIMEN URBANO (≤ 30 km)".
