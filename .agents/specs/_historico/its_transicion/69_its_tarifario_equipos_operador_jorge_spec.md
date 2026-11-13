# SPEC-069: Matriz Maestra de Valor Hora Operador/Conductor por Categoría de Equipo (Homologación Jorge)

**Versión:** 1.0.117  
**Fecha:** 2026-10-09  
**Estado:** EN APROBACIÓN POR USUARIO  
**Requerimiento Relacionado:** REQ-1019 (Tarifario dinámico de operador según categoría de equipo homologado con sistema de Jorge)

---

## 1. Contexto y Objetivo

En la versión original del software de control implementada por Jorge, el valor hora de pago al operador o conductor varía de acuerdo al tipo y tonelaje de cada equipo de la flota. 

El objetivo de esta especificación es homologar al 100% dicho comportamiento en el módulo de ITS Transición ([ItsTransicionView.vue](file:///d:/SGajardo/Google%20Drive/Antigravity/Gr%C3%BAas%20San%20Pablo/Propuesta%20Gesti%C3%B3n%20Operaci%C3%B3n%20Gr%C3%BAas/ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue)):
1. Disponer de la matriz oficial de categorías de equipos y valores hora sugeridos.
2. Auto-asignar la categoría y valor hora sugerido al cargar las patentes de la OT/Servicio.
3. Permitir cambiar la categoría desde un selector desplegable (`<select>`) en la tabla de mano de obra de la Sección 3, actualizando de inmediato la tarifa y el subtotal de costo.
4. Mantener la flexibilidad para sobreescribir el valor hora numérico o las horas en caso de acuerdos especiales.
5. Sincronizar el desglose en el visor web y en el PDF oficial compilado.

---

## 2. Matriz Canónica de Tarifas de Operador por Equipo

| Código / ID | Categoría Maestra de Equipo | Tonelaje | Valor Hora Sugerido ($ CLP) |
| :---: | :--- | :---: | :---: |
| `HORQUILLA` | GRÚA HORQUILLA | 3 - 5 Ton | **$3.000 / hr** |
| `CAMION_PLUMA_10` | CAMIÓN PLUMA 10 TON | 10 Ton | **$5.000 / hr** |
| `CAMION_PLUMA` | CAMIÓN PLUMA | Estándar | **$5.000 / hr** |
| `MANITOU` | MANITU / TELEHANDLER | Alza-hombre | **$5.000 / hr** |
| `GRUA_70` | GRÚA TELESCÓPICA 70 TON | 70 Ton | **$6.000 / hr** |
| `GRUA_80` | GRÚA TELESCÓPICA 80 TON | 80 Ton | **$7.000 / hr** |
| `TRACTO` | TRACTOCAMIÓN | Transporte | **$7.000 / hr** |
| `GRUA_100` | GRÚA TELESCÓPICA 100 TON | 100 Ton | **$8.000 / hr** |
| `GRUA_220` | GRÚA TELESCÓPICA 220 TON | 220 Ton | **$12.000 / hr** |
| `GRUA_OTRA` | OTRA MAQUINARIA / GRÚA GENERAL | — | **$8.500 / hr** |

---

## 3. Comportamiento Funcional en Frontend

1. **Selector Desplegable en Tabla Mano de Obra:**
   - En la fila de cada equipo, la columna *Categoría Maestra* muestra un `<select>` con las opciones formateadas (ej. `GRÚA TELESCÓPICA 80 TON ($7.000 / hr)`).
   - Al cambiar la opción en el `<select>`, se actualiza el override de tarifa `costos.tarifas_operadores_override[patente]` al valor correspondiente a la categoría elegida, recalculando el subtotal instantáneamente.
2. **Input Numérico de Tarifa:**
   - Permanece editable. Si el usuario escribe una tarifa manual diferente, se respeta dicho valor numérico.
3. **Persistencia y PDF:**
   - La categoría seleccionada se almacena en `costos.categorias_operadores_override[patente]`.
   - El PDF oficial muestra la categoría exacta seleccionada junto a las horas y el subtotal calculado.

---

## 4. Criterios de Aceptación

- [x] Al abrir cualquier servicio, cada equipo muestra su categoría maestra y su valor hora sugerido correspondiente a la tabla de Jorge.
- [x] Si el usuario cambia el selector de categoría (ej. de 70 TON a 100 TON), la tarifa cambia automáticamente de $6.000 a $8.000 y el total se recalcula en tiempo real.
- [x] Si el usuario edita directamente el input numérico (ej. $9.500), el subtotal toma los $9.500 sin forzar el valor de la categoría.
- [x] El PDF oficial refleja las categorías y subtotales idénticos a la pantalla.
- [x] Despliegue en DEV y PROD con Vite build 0 errores y HTTP 200 OK.
