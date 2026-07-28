# 🐞 Workflow: Corrección de Errores (`bug_fix`)

## Descripción
Protocolo obligatorio para diagnosticar y solucionar fallos en el sistema sin aplicar parches superficiales.

---

## 🔍 Paso 1: Inspección de Logs y Diagnóstico
1. **Inspeccionar Stack Trace:** Leer de forma completa y sin truncar los logs de error en consola o servidor.
2. **Identificar la Causa Raíz:** Rastrear el origen del problema (contrato roto en API, valor `null` no controlado, excepción de BD) antes de modificar código.

---

## 🛠️ Paso 2: Corrección Estructural
1. **Prohibidos Parches Superficiales:** No enmascarar síntomas con `try/catch` vacíos, retornos de datos dummy o comentarios de código roto.
2. **Preservar Contratos:** Si se modifica una firma o esquema de datos, actualizar todos los puntos de invocación en el proyecto.
3. **Verificación de Control de Flujo:** Asegurar que los estados límite (`null`, `undefined`, arrays vacíos) sean manejados limpiamente.

---

## ✅ Paso 3: Verificación de Solución
1. Probar la ejecución para verificar la eliminación limpia del error.
2. Confirmar que no se hayan generado efectos colaterales en módulos adyacentes.
