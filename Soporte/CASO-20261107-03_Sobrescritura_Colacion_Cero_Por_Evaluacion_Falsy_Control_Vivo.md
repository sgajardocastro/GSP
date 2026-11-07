# Ficha de Caso de Soporte: CASO-20261107-03

## 1. Identificación del Incidente
- **Código:** CASO-20261107-03
- **Fecha:** 2026-11-07
- **Proyecto Involucrado:** Múltiples OTs operacionales / Panel PMO Control en Vivo (`ControlVivo.vue`) y Reportes Diarios (`tedp_reporte_avance`)
- **Usuario Afectado / Reportante:** Sergio Gajardo / Jefatura de Operaciones / Analistas de Control PMO
- **Equipo Involucrado:** Flota completa de Grúas Móviles y Camiones Pluma
- **Ambiente:** Producción (`PROD`) y Desarrollo (`DEV`)
- **Severidad:** Alta (Inconsistencia en el cálculo de horas efectivas trabajadas y distorsión de jornadas operacionales continuas)
- **Estado:** RESUELTO (v1.0.202 / Mandato Constitucional Cero Parches)

---

## 2. Síntoma Reportado
Cuando un operador o el equipo de PMO registraba una jornada continua de trabajo con 0 horas de colación (`colación = 0`), al guardar o refrescar la pantalla la colación se revertía automáticamente a `1.0 hr` (60 minutos), descontando indebidamente una hora del tiempo efectivo de operación.
Asimismo, en la grilla de Control en Vivo, el cálculo de minutos trabajados restaba siempre 60 minutos sin importar lo que el usuario hubiera ingresado.

---

## 3. Causa Raíz Técnica
1. **Evaluación de Falsedad en JavaScript (Truthy / Falsy):**
   En Node.js / JavaScript, el número `0` se evalúa como `false`.
   Múltiples líneas de código utilizaban el operador lógico OR (`||`) para asignar valores por defecto:
   ```javascript
   const horasColacion = row.horas_colacion || 1.0;
   ```
   Al ingresar `row.horas_colacion = 0`, la expresión evaluaba `0 || 1.0`, retornando inmediatamente `1.0`.
2. **Minutos Fijos Restados en Cálculo de Jornada:**
   En `controlVivoController.js:1926`, el cálculo de la duración de jornada restaba una constante fija de 60 minutos:
   ```javascript
   const diffMin = Math.round((fin - ini) / (1000 * 60));
   const tiempoEfectivo = (diffMin - 60) / 60; // 60 min forzados
   ```
3. **Multiplicidad de Puntos Afectados en `reportDiarioController.js`:**
   Se detectaron fallbacks análogos en las líneas 184-186, 1835, 1931, 2025, 2283 y 3489, perpetuando la sobrescritura del valor 0 a través de los diferentes métodos del controlador.

---

## 4. Solución Aplicada (Resolución de Fondo en 4 Niveles - Cero Parches)
1. **Nivel 1 & 2 - Erradicación de Fallbacks Falsy en Backend:**
   - Se reemplazaron todas las expresiones `row.horas_colacion || 1.0` por validaciones explícitas de nulidad:
     ```javascript
     const horasColacion = (row.horas_colacion !== null && row.horas_colacion !== undefined) 
       ? parseFloat(row.horas_colacion) 
       : 1.0;
     ```
   - En el cálculo de jornada de Control en Vivo, se reemplazó `(diffMin - 60)` por `(diffMin - colacMin)`, donde `colacMin = Math.round(horasColacion * 60)`. Si la colación es 0, `colacMin` es 0 y se computa el 100% del tiempo transcurrido.
2. **Nivel 3 - Integridad en Base de Datos:**
   Se validó que los campos numéricos en `tedp_reporte_avance` (`horas_colacion numeric(4,2)`) y en los JSON de Control en Vivo respeten el valor `0.00` sin re-inyecciones.
3. **Nivel 4 - Verificación y Consistencia en Vistas:**
   Tanto en `ControlVivo.vue` como en `ReportDiarioModal.vue`, la jornada continua de 0 horas de colación se visualiza con `0.00 hrs` y las horas efectivas cuadran al minuto.

---

## 5. Archivos Intervenidos
- `ejecucion/backend_remoto/src/controllers/controlVivoController.js`
- `ejecucion/backend_remoto/src/controllers/reportDiarioController.js`
- Servidor Remoto (PROD & DEV):
  - `/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/controlVivoController.js`
  - `/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js`
  - `/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/controlVivoController.js`
  - `/home/nodeadmin/proyectos/lean-services-gsp/src/controllers/reportDiarioController.js`

---

## 6. Verificación y Resultados
- Pruebas unitarias de cálculo en backend ejecutadas:
  - Entrada: Inicio 08:00, Término 17:00, Colación 0.0 hrs -> Duración: 9.0 hrs (Antes: 8.0 hrs por resta de 60 min).
  - Entrada: Inicio 08:00, Término 17:00, Colación 1.0 hr -> Duración: 8.0 hrs.
  - Entrada: Inicio 08:00, Término 13:00, Colación 0.5 hrs -> Duración: 4.5 hrs.
- Verificación en PM2: recarga sin alertas en DEV (instancia 10) y PROD (instancia 13).

---

## 7. Lecciones Aprendidas y Acciones Preventivas
- **Regla Estricta para Valores Numéricos en JavaScript:** Nunca utilizar el operador `||` para valores numéricos donde el cero (`0`) sea un valor válido de dominio (horas de colación, descuentos, recargos, horas extras, tarifas base). Se debe usar el operador de coalescencia nula `??` o comparaciones explícitas contra `null` y `undefined`.
