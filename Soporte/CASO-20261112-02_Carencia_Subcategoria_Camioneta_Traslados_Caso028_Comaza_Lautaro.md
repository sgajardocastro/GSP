# 🛠️ Caso de Soporte Operacional: CASO-20261112-02

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261112-02`
- **Fecha / Hora:** 12-Nov-2026 11:05 CLT
- **Operador / Usuario Afectado:** Jorge Ponce (Jefatura de Operaciones / Comercial) / Héctor Beltrán (Operador Grúa)
- **Negocio / OT:** Caso 028 (`GSP-2611-00028`)
- **Cliente / Faena:** Planta Comaza Lautaro
- **Equipo Involucrado:** Grúa Telescópica, Camión Plataforma vs Camioneta de Apoyo (Flota Liviana)
- **Ambiente:** Producción (`PROD`)
- **Severidad:** Media (Bloqueo en asignación de recursos y tipificación errónea de vehículos en cotización/OT)

---

## 2. Síntoma Reportado por Terreno
Durante la estructuración y asignación de recursos para el caso 028 (Héctor Beltrán en Planta Comaza Lautaro), el servicio requería una grúa telescópica principal, traslado y contrapesos o canastillo de trabajo. Al configurar el traslado en la plataforma, el usuario Jorge Ponce se vio forzado a seleccionar la subcategoría "CAMIÓN PLATAFORMA", debido a que el sistema no ofrecía la opción de "CAMIONETA" dentro de la categoría Traslados ni desplegaba las camionetas de la empresa en la lista de asignación de recursos.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
Al auditar `GestorOportunidades.vue`:
1. En la función `fetchCategories` (L11193), la inyección de subcategorías operativas para `TRASLADOS` únicamente incluía 5 opciones:
   - `CAMA BAJA` (901)
   - `RAMPLA` (902)
   - `TRACTO CAMIÓN` (903)
   - `ESCOLTA / GUÍA` (904)
   - `CAMIÓN PLATAFORMA` (905)
2. En la función `getEquiposFiltradosPorLinea` (L8300) y `getEquiposSugeridosPuros` (L8368), la resolución semántica para vehículos menores solo buscaba por `ESCOLTA` o `GUIA`, sin reconocer el término directo `CAMIONETA`, lo que impedía que las camionetas activas de la flota (Maxus, Poer, Silverado, Jimny, Hilux, L-200) se agruparan como sugeridas.

---

## 4. Causa Raíz de Arquitectura
- El catálogo de subcategorías para la categoría comercial `TRASLADOS` se encontraba restringido en el frontend a 5 alternativas rígidas, omitiendo camionetas y vehículos livianos de traslado de carga menor o implementos de izaje (contrapesos, canastillos, grilletes y aparejos).
- En el filtrado de equipos de la línea de traslado, `getEquiposSugeridosPuros` no contaba con delegación a la regla semántica de traslados, enviando a los vehículos a la sección genérica de flota.

---

## 5. Plan de Mitigación y Resolución
1. **Inclusión de Subcategoría:** Se incorporó formalmente `{ id_subcategoria: 906, nombre_subcategoria: 'CAMIONETA' }` al catálogo de `TRASLADOS` en `GestorOportunidades.vue`.
2. **Filtro de Flota Sugerida:** Se extendió el criterio de búsqueda en `getEquiposFiltradosPorLinea` y se vinculó en `getEquiposSugeridosPuros` para que toda línea con `subcategoria = 'CAMIONETA'` clasifique automáticamente a todas las camionetas activas de Grúas San Pablo en el grupo *"🎯 Equipos Sugeridos"*.
3. **Control de Versiones y Release:** Se incrementó la versión web a `v1.0.219`, validando compilación de Vite en modo producción con 0 errores y cumpliendo el Hard Gate de gobernanza.

---

## 6. Protocolo de Respuesta y Guía al Usuario / Operador
- Al abrir el Gestor de Oportunidades en la OT 028 (`GSP-2611-00028` - Comaza Lautaro) o en cualquier servicio que incluya traslados, el usuario puede seleccionar libremente la subcategoría **`CAMIONETA`**.
- El selector de equipos desplegará de inmediato la lista de camionetas disponibles de la flota de Grúas San Pablo (Maxus, Poer, Silverado, etc.) con sus patentes y acreditaciones vigentes, sin requerir regenerar la cotización ni forzar camiones pesados.

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- Se mantiene en backlog técnico (`REQ-1160`) la migración de todas las categorías y subcategorías sintéticas hacia tablas relacionales normalizadas en PostgreSQL (`tequ_categoria` y `tequ_subcategoria`), eliminando inyecciones en memoria en el frontend.
