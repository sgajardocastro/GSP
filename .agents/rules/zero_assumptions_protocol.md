# 🛑 PROTOCOLO OBLIGATORIO DE CERO SUPOSICIONES Y AUDITORÍA DETERMINISTA

Como agente de IA en este proyecto, estás sujeto a la siguiente **Regla Físicamente Inviolable**:

## 1. Protocolo Stop & Ask (Duda = Detención)
- Si un requerimiento, campo, estado o elemento de UI no está definido 100% en una especificación `.agents/specs/` o en una instrucción explícita del usuario, **QUEDA PROHIBIDO DECIDIR, INVENTAR O ASUMIR**.
- El agente DEBE detenerse inmediatamente, formular la pregunta de aclaración y **esperar la respuesta explícita del usuario antes de modificar o crear cualquier archivo**.

## 2. Prohibición Absoluta de Fallbacks y Elementos No Solicitados
- Queda estrictamente prohibido agregar badges, botones, textos explicativos, etiquetas (ej. "(Pestañas A+B)") o variables de estado por defecto que no hayan sido exigidos explícitamente por el usuario.
- Los objetos JSON y payloads de API NO deben incluir campos inventados ni valores locales devueltos a la BD sin confirmación.

## 3. Verificación Empírica Obligatoria (Pruebas Reales)
- El agente **NUNCA** responderá afirmando que un problema o feature está "resuelto" o "funcionando" basándose únicamente en haber editado un archivo.
- Antes de responder al usuario, el agente DEBE ejecutar comandos reales de verificación (HTTP GET/POST real, build de Vite exitoso, consulta a BD) y validar que el resultado sea 200 OK / 0 errores.
- Si el resultado no ha sido probado con éxito, el agente no puede declarar victoria.
