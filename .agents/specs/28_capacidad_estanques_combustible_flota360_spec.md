# 📄 Especificación Técnica Formal: Capacidad de Estanques de Combustible (Flota 360)
**Ficha Spec-Driven ID:** `SPEC-28-FLOTA-ESTANQUES`  
**Estado:** `CONCLUIDO / IMPLEMENTADO`  
**Ubicación de Implementación:** `ejecucion/frontend/src/components/ModalCrearEditarEquipo.vue`

---

## 📌 1. Objetivos del Negocio y Dominio Mecánico
En el transporte de maquinaria pesada e izaje industrial (Grúas San Pablo), la gestión del consumo y abastecimiento de diésel requiere registrar con precisión la capacidad de estanques de combustible por unidad de flota.

Mecánicamente, la flota se compone de dos configuraciones:
1. **Unidades Monomotor (1 Estanque):** Camiones Pluma, Camiones Cama Baja, Manipuladores Telescópicos, Camionetas y Vehículos Menores. Poseen un único estanque asociado al motor de marcha/chasis.
2. **Unidades Bimotor / Grúas Telescópicas AT/RT (2 Estanques):** Grúas Móviles de alto tonelaje que cuentan con un motor para el chasis/carrier y un motor independiente para la superestructura/cabina de izaje.

---

## 📐 2. Modelo de Datos y Atributos (Data Contract)

### Atributos del Equipo (`form` / `tequ_equipo`):
* `cantidad_estanques`: Number (`1` o `2`, por defecto `1`).
* `capacidad_estanque_chasis_litros`: Number / Null. Capacidad en litros del Estanque 1 (Chasis / Motor Traslado).
* `capacidad_estanque_grua_litros`: Number / Null. Capacidad en litros del Estanque 2 (Superestructura / Motor Izaje Grúa). Se activa y visualiza **únicamente** cuando `cantidad_estanques === 2`.
* `capacidad_estanque_combustible_litros`: Number / Null. Campo legacy de retrocompatibilidad.

---

## 🎨 3. Especificación de Componente UI/UX (`ModalCrearEditarEquipo.vue`)

### A. Botonera Toggle de Configuración (1 Clic)
- `⛽ 1 Estanque (Monomotor / Camión)`: Al presionar marca `cantidad_estanques = 1` y limpia `capacidad_estanque_grua_litros = null`.
- `🏗️ 2 Estanques (Bimotor / Grúa AT)`: Al presionar marca `cantidad_estanques = 2`.

### B. Layout de Inputs Dinámicos
- `cantidad_estanques === 1`: Se despliega 1 sola columna con el campo `Estanque 1: Chasis / Motor Traslado (Lts)`.
- `cantidad_estanques === 2`: Se despliegan 2 columnas en paralelo con `Estanque 1` y `Estanque 2: Grúa / Motor Izaje (Lts)`.

---

## ⚙️ 4. Inferencia Automática Asistida
Al cambiar la categoría del equipo (`onCategoryChange`):
* Si el nombre de la categoría contiene `"Grúa"`, `"Grua"` o `"Telescópica"`, la UI conmuta automáticamente a `cantidad_estanques = 2`.
* Si el nombre corresponde a camiones, camas bajas o vehículos menores, la UI conmuta a `cantidad_estanques = 1`.
* En ambos casos, el usuario mantiene siempre la libertad de alternar el selector manual con 1 clic.

---

## 🔄 5. Retrocompatibilidad (`loadData`)
Al cargar un equipo existente (`isEdit = true`), si la base de datos registra únicamente `capacidad_estanque_combustible_litros` (legacy), la función `loadData()` mapea automáticamente ese valor a `capacidad_estanque_chasis_litros` e inicializa `cantidad_estanques = 1`, garantizando cero corrupción de datos preexistentes.
