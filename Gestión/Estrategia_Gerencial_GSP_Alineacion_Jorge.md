# 📋 Minuta de Trabajo: Ajustes de Alcance y Cierre del Proyecto
---

## 1. Objetivo de la Reunión

Revisar el estado del proyecto, cerrar los frentes de trabajo pendientes y acordar una forma de trabajo simple y práctica para cada área, asegurando que el sistema sea útil en el día a día sin generar sobrecarga administrativa.

> **Principio Clave a Transmitir a Gerencia:**  
> *"Una cosa es que el software tenga la funcionalidad lista y otra es que los hábitos, prácticas y procesos de la empresa estén maduros para operarla. Para que el proyecto sea un éxito total, debemos implementar de forma gradual y práctica, evitando que se culpe a la tecnología por falta de rutinas operativas en terreno o taller."*

---

## 2. Definición de los 7 Temas Clave

---

### 📁 1. Acreditación de Faenas (Requerimiento de Dayana)

#### Situación Actual:
Dayana necesita gestionar la documentación para las **4 empresas del grupo** (*Grúas San Pablo, Bestmaq, Logística del Sur y Royal Rental*). Actualmente se subían papeles de los trabajadores, pero faltaba ordenar la documentación propia de cada empresa y de cada equipo.

#### Propuesta de Solución (Estructura en 3 Carpetas Simples):

1. **Carpeta de la Empresa (por Razón Social):**
   * Escritura de constitución y vigencia de poderes.
   * Iniciación de actividades y RUT digital.
   * Carpeta tributaria.
   * Certificados laborales F30 / F30-1.
   * Reglamento Interno (RIOHS).

2. **Carpeta de la Máquina / Camión:**
   * Padrón del vehículo (RVM).
   * Revisión Técnica, Permiso de Circulación y SOAP.
   * Certificación técnica vigente del equipo.
   * Tablas de carga del fabricante.

3. **Carpeta del Trabajador:**
   * Contrato de trabajo (asociado a la empresa que corresponda).
   * Cédula de identidad y Licencia municipal (Clase D / A4 / A5).
   * Examen médico vigente.
   * Registro de entrega de EPP y charla de inducción/ODI.

> **Resultado Práctico:**  
> Dayana selecciona el servicio, la empresa que cotizó, la grúa y el operador asignado, y el sistema arma de inmediato el paquete de documentos en PDF listo para enviar al cliente.

---

### 💼 2. Área de Contabilidad (Delimitación Clara / Sinergia con Laudus ERP? )

#### Situación Actual:
Existía la inquietud sobre cómo conversaría el sistema con las labores contables diarias, evitando duplicidades de trabajo o roces con el equipo financiero.

#### Propuesta de Solución:
El sistema se convierte en el mejor aliado de Contabilidad:

* **Lo que hace el sistema (Operaciones y Terreno):**
  * Registra las horas trabajadas en obra mediante el Report Diario firmado por el cliente.
  * Calcula las horas facturables y los sobretiempos según la tarifa pactada.
  * Consolida la **Pre-Factura / Estado de Pago (EDP)** con todo el respaldo de firmas y faena.
  * Registra los gastos directos del servicio (viáticos, peajes, petróleo en ruta).
  * Implementamos Factura Electrónica y nos integramos con Laudus (opcipon A)

* **Lo que hace Contabilidad (en Laudus ERP):**
  * Emite la factura electrónica legal en el SII (opcipon B) y realiza el cierre contable/tributario habitual.

> **Resultado Práctico:**  
> Contabilidad no pierde tiempo persiguiendo libretas ni calculando horas; recibe los cobros ya cuadrados desde terreno, listos para facturar en Laudus.

---

### 🔧 3. Mantenimiento de Maquinaria y Taller (Software vs. Madurez de Procesos)

#### Situación Actual:
El módulo de mantenimiento del sistema permite llevar planes preventivos, alertas de horómetros y órdenes de trabajo (OT) de taller. Sin embargo, en la práctica del taller de grúas, **no tengo claridad del estado de procesos formales respecto a la gestión de pautas mecánicas**. 
> En mi experiencia, el área de mantenimiento es por antonomásia un área entorno donde la incorporación de tecnología de gestión suele ser fuertemente resistida.

Si forzamos de golpe un control exhaustivo de taller, los mecánicos no lo usarán y existirá la falsa impresión de que *"el sistema no funciona"*, cuando el problema de fondo es la falta de una rutina de trabajo establecida, practicas y procesos.

#### Propuesta de Solución (Implementación en 2 Etapas):

1. **Etapa 1 - Preventivo Básico por Horómetro y Alertas (Inmediato):**
   * El sistema se alimenta automáticamente de los **horómetros que registran los operadores en la PWA** al inicio y término de cada jornada.
   * Semáforo de alerta automática de mantención preventiva: cada 250, 500 y 1.000 horas (aceites, filtros, engrase).
   * Registro de fallas detectadas en el Check pre-operacional diario del operador.

2. **Etapa 2 - Órdenes de Trabajo de Taller y Pautas Mecánicas (Mediano Plazo):**
   * A medida que el jefe de taller y los mecánicos adopten la rutina, se activa la apertura de OT de mantenimiento correctivo y el consumo de repuestos por equipo.

> **Resultado Práctico:**  
> El sistema cuida los motores y equipos desde ya avisando cuándo toca mantención según el trabajo real, sin ahogar al taller en papeleo antes de tiempo.

---

### 📦 4. Inventario y Bodega (Operación Práctica en Patio y Taller)

#### Situación Actual:
Va de la mano con mantenimiento. Llevar un inventario de cada perno o golilla suele fracasar si no hay un pañolero dedicado.

#### Propuesta de Solución:
Partir controlando exclusivamente lo que tiene valor real y riesgo de pérdida:

1. **Combustible (Petróleo):**
   * Registro de litros cargados, odómetro/horómetro del equipo y foto del comprobante de carga (sea en patio o en estación de servicio).
2. **Aparejos y Elementos de Izaje:**
   * Control de eslingas, grilletes, estrobos y cadenas (número de serie, fecha de revisión y estado operativo).
3. **Repuestos y Neumáticos Principales:**
   * Registro de salida con asignación directa a la patente de la máquina.

> **Resultado Práctico:**  
> Se cuida el petróleo y los elementos de izaje, que representan el mayor costo y el mayor riesgo de seguridad de la operación.

---

### 🛒 5. Compras y Facturas de Compra (Cero Doble Digitación en Laudus ERP)

#### Situación Actual:
Nuestro objetivo es procesar las compras y facturas en el sistema, pero para que esto sea un alivio real y no una traba, el flujo debe integrarse con Contabilidad para que los datos pasen directamente a **Laudus ERP** sin necesidad de digitación manual.

#### Propuesta de Solución (Circuito Completo y Carga Automática):

1. **Solicitud de Compra (SolPed):** El taller o faena solicita el repuesto, servicio o insumo indicando la máquina o proyecto destino.
2. **Orden de Compra (OC):** Jefatura autoriza el gasto, proveedor y valor acordado.
3. **Recepción en Taller:** Al recibir el material, se registra el ingreso y se adjunta la foto de la Guía de Despacho.
4. **Registro de la Factura de Proveedor:** Se ingresa la factura vinculándola a la OC y Guía de Despacho ya aprobadas.
5. **Carga Automática a Laudus ERP:** Según el protocolo acordado con Contabilidad, la información de la factura de compra se exporta/carga a Laudus, eliminando la digitación manual del equipo contable.

> **Resultado Práctico:**  
> Contabilidad se ahorra cientos de horas al mes digitando facturas de proveedores en Laudus, y la Gerencia obtiene el costo real de cada grúa y servicio al día.

---

### 💵 6. Reglas de Valorización (Tarificación y Cobro de Servicios)

#### Situación Actual:
Las reglas de cómo cobrar horas mínimas, extras o traslados están en la costumbre del equipo pero no formalizadas en el sistema, lo que genera dudas al momento de liquidar.

#### Propuesta de Solución (Formalizar 6 Reglas Claras):

1. **Horas Mínimas Garantizadas:**
   * Grúas chicas y medianas: Mínimo 4 horas por servicio.
   * Grúas de alto tonelaje: Mínimo 8 horas por servicio.
   * *Si la faena dura 2 horas, se cobra el mínimo establecido.*

2. **Cálculo de Horas Efectivas y Colación:**
   $$\text{Horas Trabajadas} = (\text{Hora Término} - \text{Hora Inicio}) - \text{Tiempo de Colación}$$
   * La colación estándar es de 1 hora (se define si es descontable según cotización).

3. **Sobretiempo (Horas Extra):**
   * Todo tiempo por sobre las horas base cotizadas se liquida como hora extra según el valor hora acordado.

4. **Fletes y Camas Bajas:**
   * El traslado de contrapesos o grúas en cama baja se cobra como tarifa fija por viaje/flete o por hora, independiente del trabajo de la grúa.

5. **Tiempos de Espera (Stand-by):**
   * **Por culpa del cliente** (no tienen la carga lista, falta acceso): Se cobra el valor hora completo de la grúa.
   * **Por clima** (mucho viento o lluvia que impide izar): Se cobra el mínimo pactado de la jornada.

6. **Personal Adicional (Riggers / Señaleros):**
   * Se cobra un valor fijo por jornada o valor hora adicional por persona.

---

### 🚜 7. Inspecciones de Entrada y Salida de Patio (Checklist Autónomo)

#### Situación Actual:
Hoy la revisión de cómo sale y cómo vuelve una máquina (luces, neumáticos, estado de cabina, aparejos de izaje, insumos de seguridad y petróleo) se realiza de manera informal o en papel. Las máquinas salen a mantención, traslados entre bases o faenas particulares sin que exista necesariamente una OT administrativa abierta en ese instante.

#### Propuesta de Solución (Autonomía Operativa en PWA):
Habilitar un acceso prioritario y directo en la App móvil: **`[ 🚧 Inspección Entrada / Salida de Patio ]`**.
* **Acceso con 1 toque:** El operador o pañolero entra directamente sin depender de asignaciones previas desde oficina.
* **Selección simple y con buscador de texto:**
  1. **Tipo de Movimiento:** Selector `[ ENTRADA ]` o `[ SALIDA ]`.
  2. **Placa Patente:** Selector con buscador de texto (autocompletado en vivo por patente o modelo de máquina para toda la flota de las 4 empresas).
  3. **Operador / Inspector:** Nombre del responsable (pre-cargado por sesión).
  4. **N° OT / Destino (Opcional):** Si va o viene de una faena se ingresa, si es movimiento interno queda vacío.
* **Resolución interna de datos (Cero errores de BD):** El sistema asigna de fondo la empresa propietaria y el proyecto interno de control de flota, cumpliendo con la base de datos sin trasladarle burocracia al operador.
* **Inspección técnica rápida con evidencia:**
  * Estado de cabina, luces, frenos y neumáticos (con fotos obligatorias).
  * Control de contrapesos y aparejos de izaje (eslingas, cadenas, grilletes).
  * Extintor (con fecha de vencimiento), insumos de seguridad y documentación al día.
* **Cierre y Firma Digital:** Registro de horómetro/odómetro y firma FES en pantalla.

> **Resultado Práctico:**  
> Se elimina la burocracia de oficina en el portón y queda un registro fotográfico con fecha, hora y firma de cómo salió y cómo volvió cada equipo, blindando a la empresa ante roturas o pérdidas de aparejos.

