# 🛑 REGLA CONSTITUCIONAL: RESOLUCIÓN DE FONDO ESTRUCTURAL Y PROHIBICIÓN TOTAL DE PARCHES DE SÍNTOMA ("CERO PARCHES")

> **"Un parche de síntoma es una negligencia profesional. Maquillar un error para apagar un reclamo destruye la confianza del cliente, daña la reputación del servicio y deja la bomba de tiempo activa en el sistema. La solución es DE FONDO o no es solución."**

---

## 1. Principio Fundamental: Prohibición Total de Parches Cosméticos

Queda **ESTRICTAMENTE PROHIBIDO** aplicar soluciones que únicamente modifiquen la capa final de visualización, metan un `if` de excepción en el endpoint consumidor, o ejecuten un `UPDATE` manual aislado para salvar la fila que reportó el cliente.

Todo incidente, soporte o falla de datos debe ser diagnosticado y resuelto **estructuralmente en los 4 niveles de la cadena de software**:

1. **Nivel 1: Origen del Dato (Inception):**
   - ¿Dónde y quién origina la información? (Formulario PWA, CRM, importación, inicio de jornada).
   - Se debe corregir el componente de captura para que el dato nazca íntegro, validado y completo desde el primer milisegundo.

2. **Nivel 2: Servicios Intermedios y Motores de Cálculo (Core Logic):**
   - Se debe corregir la lógica de negocio, servicios y controladores intermedios para que procesen la entidad de forma determinista y simétrica.
   - **PROHIBICIÓN TOTAL DE FALLBACKS TRAMPOSOS:** Queda estrictamente prohibido utilizar expresiones como `colacion || 60` o `piso || 8.0` que sobreescriban silenciosamente valores legítimos de `0` o modalidades especiales (ej. servicios mensuales o regímenes urbanos).

3. **Nivel 3: Modelo de Datos y Persistencia Relacional (Database Integrity):**
   - Los datos críticos de negocio (IDs de operadores, riggers, equipos, tarifas) **DEBEN vivir en columnas relacionales tipadas con claves foráneas**, nunca ocultos o abandonados exclusivamente en blobs JSON (`json_field`).
   - Si una columna relacional existe (`id_user_rigger`), es inadmisible que quede en `NULL` si el proyecto tiene dicho recurso asignado.

4. **Nivel 4: Consolidación, Auditoría y Presentación Final (Output & Views):**
   - La capa de presentación (Visor web, ITS, EDP, PDF con `wkhtmltopdf`) debe limitarse a reflejar con fidelidad matemática los datos consolidados, sin inventar ni reescribir lógica que debió resolverse aguas arriba.

---

## 2. Obligación de Barrido Transversal y Detección de Casos Similares

Cuando un cliente o usuario reporte un incidente sobre una OT, un trabajador o un documento puntual:

1. **PROHIBIDO EL SANEAMIENTO AISLADO:** El agente no puede limitarse a reparar únicamente el caso reportado (ej. "arreglar solo la OT 35 de Inarco").
2. **AUDITORÍA DE IMPACTO TRANSVERSAL:** El agente tiene la obligación inexcusable de ejecutar una consulta SQL de auditoría sobre toda la base de datos (`sch_leangsp_prod` y `sch_leangsp`) para identificar:
   - ¿Cuántas otras OTs presentan el mismo síntoma?
   - ¿Cuántos otros trabajadores tienen sus datos omitidos o descalzados?
   - ¿Qué otros contratos o reportes arrastran la misma inconsistencia?
3. **DATAFIX SISTÉMICO:** El saneamiento en base de datos debe abarcar a **TODOS** los registros afectados de forma determinista y documentada.

---

## 3. Cero Tolerancia a Declaraciones Prematuras de Victoria

1. El agente tiene terminantemente prohibido responder que un caso está "resuelto", "solucionado" o "cerrado" si únicamente aplicó un parche cosmético en el frontend o en un único archivo.
2. Toda solución de fondo exige verificar empíricamente:
   - Que el flujo de creación genera el dato correcto.
   - Que la base de datos almacena el registro consistente.
   - Que los casos históricos quedaron saneados.
   - Que no existen regresiones colaterales en la cadena de liquidación.
