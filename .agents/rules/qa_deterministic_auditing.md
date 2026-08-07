# 🛡️ Regla de Auditoría Determinista (QA Hard-Gates)

## 📌 Contexto y Razón de Ser
El ecosistema de agentes de IA tiene una tendencia natural a sufrir "Ceguera de Contexto" y aprobar código basándose en los casos felices que un agente desarrollador reporta, omitiendo auditar el resto de la base de código. Para el producto LeanGlobal, **la confianza ciega entre agentes está estrictamente prohibida.**

## 🚫 Protocolo de Aprobación de Código (Cero Confianza)
1. **Prohibición de QA Mental:** Un subagente QA NUNCA debe emitir un veredicto de "Aprobado" basándose únicamente en leer el código que el desarrollador afirma haber modificado.
2. **Scripts Deterministas Obligatorios:** Antes de emitir cualquier certificación, el subagente QA está **OBLIGADO** a ejecutar comandos de escaneo masivo (ej. `grep -rn 'string_prohibido' src/`) sobre todo el proyecto para demostrar matemáticamente que el código heredado, variables hardcodeadas, o rutas físicas absolutas (`/u05/LeanDocs`, URLs de producción) han sido erradicadas por completo.
3. **Bloqueo de Pipeline:** Si el script de validación arroja un (1) solo resultado negativo, el QA debe **RECHAZAR** el pase a producción y devolver el ticket al desarrollador adjuntando la salida exacta del terminal, forzándolo a corregir los archivos restantes.

## 📝 Checklists para Refactorizaciones Masivas
Cuando el usuario o el agente arquitecto asigne una tarea de refactorización que abarque múltiples archivos (ej. 28 puntos de contacto):
- El prompt de delegación DEBE incluir la lista exacta de las rutas de los archivos a modificar.
- Si no se tiene la lista, el primer paso del agente debe ser usar `grep_search` para mapear y guardar la lista de archivos en un artefacto temporal (Task List), y no detenerse hasta que todos los elementos de la lista hayan sido procesados.
