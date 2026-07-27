# 📊 Concepto y Operación del Devengado en Grúas San Pablo (GSP)

Este documento detalla el concepto de **devengado** como principio rector del control de gestión financiera de la empresa, su tratamiento contable bajo IFRS, su impacto tributario ante el SII y su valor ante instituciones bancarias.

---

## 1. Definición Conceptual: La Realidad Económica

El **devengado** es el reconocimiento económico continuo del servicio entregado. Representa el registro de los ingresos y costos en el período en el que efectivamente se ejecuta el trabajo (hecho económico), independientemente de cuándo se emita la Orden de Compra (OC), la aprobación del Estado de Pago (EDP), la factura definitiva o el ingreso del dinero en caja.

> [!IMPORTANT]
> El devengado es la **verdadera productividad** del negocio. Si una grúa trabajó durante el mes de junio, la ganancia existe y se registra en junio, aunque la burocracia comercial del cliente retrase la factura hasta agosto.

---

## 2. Tratamiento Contable (IFRS / NIIF 15)

Para registrar la "zona gris" que ocurre entre la ejecución del servicio y la facturación, se utiliza una cuenta puente de activo circulante.

### Cuentas Clave
*   **Ingresos por Facturar (o Servicios Devengados por Cobrar):** Activo Circulante. Representa el derecho adquirido sobre el trabajo realizado que aún no se ha facturado formalmente.
*   **Ingresos por Servicios:** Cuenta de Resultado (Ingreso).
*   **Costos Devengados por Pagar / Proveedores Devengados:** Pasivo Circulante (para lograr el matching de costos directos no facturados por subcontratistas en el mismo mes).

### Dinámica de Asientos Contables
*Ejemplo: Servicio mensual por $1.000.000 neto prestado en Junio (pendiente de OC del cliente).*

#### Paso A: Al cierre del mes de prestación (30 de Junio)
Se registra el ingreso y el activo puente (derecho de cobro real):
```
----------------- Asiento 1 (30 de Junio) -----------------
Ingresos por Facturar (Activo Circulante)      $1.000.000 (Debe)
    a Ingresos por Servicios (Resultado/Ingreso)            $1.000.000 (Haber)
```

#### Paso B: El match de costos directos (30 de Junio)
Si hubo costos asociados por $400.000 de subcontratos sin factura recibida aún, se devengan para no inflar el margen:
```
----------------- Asiento 2 (30 de Junio) -----------------
Costos del Proyecto (Resultado/Gasto)          $400.000 (Debe)
    a Costos Devengados por Pagar (Pasivo Circ.)             $400.000 (Haber)
```

#### Paso C: Emisión de la Factura con la OC (Ejemplo: 15 de Julio)
Cuando llega la OC y se factura, se reversa la cuenta puente y se carga la cuenta de clientes y el IVA:
```
----------------- Asiento 3 (15 de Julio) -----------------
Clientes (Activo Circulante)                   $1.190.000 (Debe)
    a Ingresos por Facturar (Activo / Reverso)              $1.000.000 (Haber)
    a Débito Fiscal IVA (Pasivo Circulante)                 $190.000 (Haber)
```
*Nota: El ingreso contable del mes de julio por este servicio es $0, ya que quedó reconocido en junio.*

---

## 3. Beneficios para el Control de Gestión

1.  **Evita el "Efecto Montaña Rusa":** Si solo se registra por facturas, un mes mostraría pérdidas artificiales (costos de operadores y combustibles devengados pero sin facturar) y el siguiente utilidades ficticias. El devengado estabiliza la lectura del margen real.
2.  **Visibilidad del Riesgo de Capital de Trabajo:** La cuenta *Ingresos por Facturar* mide cuánta plata tiene la empresa "atrapada" en la burocracia de los clientes. Si esta cuenta sube constantemente, indica problemas de cobranza o emisión de OC.

---

## 4. Tratamiento Tributario en Chile (SII)

El tratamiento de los ingresos devengados no facturados difiere según el impuesto y el régimen tributario de la empresa:

| Impuesto / Régimen | Mensual (F29 - IVA) | Anual (F22) - Régimen General (14 A) | Anual (F22) - Régimen ProPyme (14 D N°3) |
| :--- | :--- | :--- | :--- |
| **¿Paga Impuesto?** | **No.** El IVA se posterga hasta la emisión de la factura o el pago real. | **Sí.** El SII obliga a tributar el Impuesto de Primera Categoría (27%) en el año que se prestó el servicio. | **No.** Se descuenta de la base imponible y tributará recién al ser percibido (caja) en el F22 del año siguiente. |
| **Mecanismo SII** | No aparece en el Registro de Compras y Ventas (RCV). | Se declara en el Balance de 8 Columnas y en la Renta Líquida Imponible (RLI) anual. | Se concilia restándolo en el Balance Tributario ProPyme mediante la Declaración Jurada 1924. |

---

## 5. Valor del Devengado frente a la Banca

Los bancos evalúan el riesgo corporativo y la capacidad de endeudamiento a través del devengado (normas IFRS/NIIF), lo que lo convierte en un activo de negociación estratégica:

*   **Protección del EBITDA:** Al registrar los *Ingresos por Facturar*, tu EBITDA se mantiene sólido y estable. El banco entiende que la falta de liquidez es burocrática del cliente (descalce de caja) y no un problema de viabilidad del negocio.
*   **Justificación de Capital de Trabajo:** Muestra con exactitud la calidad y el volumen de tu cartera de contratos vigentes, justificando solicitudes de líneas de crédito temporales.
*   **Acceso a Financiamiento de Contratos:** Permite calificar para líneas de factoring especializadas o financiamiento de contratos/hitos antes de emitir la factura final.

---

## 6. Estado de Resultados (Rentabilidad) vs. Flujo de Caja (Liquidez)

*   **Estado de Resultados (P&L):** Mide la **rentabilidad** y se rige por el devengado (cuándo se realiza el trabajo). Muestra si el modelo de negocio es viable.
*   **Flujo de Caja (Cash Flow):** Mide la **liquidez** y se rige por el criterio de lo percibido (cuándo entra/sale físicamente la plata de la cuenta corriente). Muestra si hay fondos para pagar las cuentas hoy.
