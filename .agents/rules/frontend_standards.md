# 🎨 Estándares Frontend UI/UX: Grúas San Pablo (GSP)

## 1. Stack Tecnológico Frontend
- **Framework:** Vue 3 (Composition API con `<script setup>`).
- **Estilos:** Vanilla CSS / TailwindCSS estructurado. Evitar estilos globales ad-hoc sin variables.
- **Iconografía:** `lucide-vue-next`.
- **Enrutamiento:** Vue Router en `ejecucion/frontend/src/router/index.js`.
- **Estado Global:** Pinia o Reactivity API (`reactive`, `ref`).

## 2. Principios de Diseño Visual (WOW Factor)
- **Aesthetic Premium:** Interfaces modernas, limpias, estilo industrial/corporativo.
- **Tipografía:** Usar fuentes limpias y legibles (`Inter`, `Outfit` o fuentes del sistema).
- **Paleta de Colores Corporativa:**
  - Colores primarios: Tonos de azul/amarillo industrial de Grúas San Pablo.
  - Modos oscuros/claros limpios con alto contraste y legibilidad.
- **Efectos e Interacción:** Micro-animaciones en botones, estados de hover suaves (`transition-all duration-200`), spinners de carga para llamadas asíncronas (`apiAxios`).

## 3. Reglas de Componentes
- **Sin Placeholders:** No usar textos en blanco o datos "dummy" sin fallback funcional.
- **Modales:** Reutilizar modales estándar (`ModalNuevoCliente`, `ModalCrearEditarEquipo`, `ModalCrearEditarPersonal`) con estados duales (Creación / Edición).
- **Grillas Dinámicas:** Siempre incluir indicadores visuales de carga (`loading`), estados de lista vacía (`empty state`) y buscadores en tiempo real.
