# Especificación Técnica 16a: Casos de Uso y Comportamiento de Flags Comerciales

A continuación, se detalla el comportamiento exacto de los 5 *Flags* operativos y comerciales, acompañados de ejemplos prácticos para establecer las reglas de negocio y su impacto en los distintos módulos del ecosistema GSP.

---

### 1. Requiere OC / HES (Orden de Compra / Hoja de Entrada de Servicios)
**Concepto:** Este flag indica si el mandante exige estrictamente la emisión de una OC o HES formal para poder aceptar facturas por los servicios prestados.
* **Ejemplo Práctico:**
  * **Contexto:** Arriendo de Grúa para CMPC.
  * **Estado del Flag:** `ON` (Activado).
  * **¿Qué pasa en la práctica?** El área comercial cierra la venta y Operaciones ejecuta el servicio de manera normal en terreno. Sin embargo, al finalizar la faena y pasar el expediente a **Facturación (EDP)**, el sistema **bloqueará** al analista, impidiéndole emitir y enviar la factura hasta que suba a la plataforma el documento oficial (OC o HES) enviado por CMPC. Esto elimina el riesgo de facturas rechazadas por falta de respaldo.

---

### 2. Requiere Acreditación
**Concepto:** Determina si el cliente o la faena específica exige que tanto la maquinaria como el personal pasen por un proceso formal de acreditación (subida de documentos, certificaciones, pases, etc.) antes de ingresar.
* **Ejemplo Práctico:**
  * **Contexto:** Ingreso a faena en Minera Escondida.
  * **Estado del Flag:** `ON` (Activado).
  * **¿Qué pasa en la práctica?** Al momento en que el comercial marca la oportunidad como "Ganada", el sistema no solo crea la Orden de Trabajo, sino que detona en paralelo (de manera asincrónica) una fase exclusiva de **Acreditación**. El analista HSEQ recibe una alerta para preparar las carpetas del personal. Operaciones puede ir armando la tripulación, pero el sistema generará advertencias de seguridad si intentan despachar a terreno a un operador o grúa que aún no tenga su "luz verde" de acreditación.

---

### 3. Servicio Incluye Traslado (Flete)
**Concepto:** Define cómo se presenta y gestiona comercialmente el costo de movilización de los equipos.
* **Regla:** El flag está en ON y en el Estructurador Económico se agrega una línea de Flete por $500.000.
* **Impacto:** En el PDF de la Cotización que recibe el cliente, aparecerá una línea visible y explícita detallando "Servicio de Traslado/Flete: $500.000".

---

### 4. Requiere Riger
**Concepto:** Especifica si la maniobra exige normativamente la presencia de un Riger certificado.
* **Estado del Flag:** ON (Activado).
* **Comercial - Cotización:** SIEMPRE se muestra si el servicio incluye Rigger o no, dejando por explícito con un Si o un no.
* **Comercial - Estructurador de Servicios:** Si el flag está en "Si", en el estructurador se agrega en forma automática la línea de Rigger. Si el flag Rigger estuviera en No pero en el estructurador se agrega Rigger, entonces el Flag automáticamente se debe marcar en Si. Ambos elementos (flag en preventa e ítem en estructurador de servicios) son reflejos de la misma condición. En el estructurador este ítem puede tener valor Cero.
* **Impacto Operativo (Asignación):** Al pasar a la etapa de Asignación, el despachador verá un requerimiento obligatorio en la pantalla que dice "Asignar Riger".

---

### 5. Combustible a Cargo del Cliente
**Concepto:** Aclara legal y operativamente quién asume el suministro y costo del petróleo (Diésel) que consumirá la grúa durante la operación.
* **Ejemplo Práctico:**
  * **Contexto:** Arriendo mensual "Dry" (operación en seco) para una constructora en zona aislada.
  * **Estado del Flag:** `ON` (Activado).
  * **Impacto Comercial (Cotización):** En el PDF de la cotización, sección *"2. DATOS DE OPERACIÓN E INGENIERÍA"*, se dejará constancia explícita de que el combustible es responsabilidad exclusiva del cliente, blindando a Grúas San Pablo ante reclamos.
  * **Impacto Operativo / Facturación:** A Operaciones de Despacho no le afecta en su pantalla (ya que no deben asignar un camión surtidor). Sin embargo, al final del mes, en la etapa de **Facturación**, el sistema le recordará visualmente este acuerdo al analista. Esto sirve para dos cosas: (1) Evitar cobrar un recargo erróneo por combustible, o (2) Facilitar la conciliación en caso de que Grúas San Pablo haya tenido que cargar combustible de emergencia y deba cobrárselo al cliente de forma adicional.
