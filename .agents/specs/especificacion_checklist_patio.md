# 🛡️ Especificación Técnica: Checklist de Entrada y Salida de Patio (GSP)

## 📌 1. Objetivo y Ámbito
Digitalizar y estandarizar el protocolo de inspección técnica de **Entrada y Salida de Patio** de maquinarias y equipos de Grúas San Pablo, permitiendo el control riguroso del estado del equipo, implementos de izaje, insumos de seguridad, documentación y firmas operativas desde la PWA.

---

## 🏷️ 2. Segmento 1: Datos Generales de la Inspección
Definido explícitamente con las reglas de negocio acordadas:

| Campo | Tipo Componente | Esquema JSON Canónico | Obligatorio |
| :--- | :--- | :--- | :--- |
| **Tipo de Movimiento** | `comboBox` | `values: { quest: "TIPO DE MOVIMIENTO", selected: "", options: [{ id, label, value }] }` | Sí |
| **Número de OT / Proyecto** | `textField` (`SYSTEM`) | `type: "textField"`, `label: "NUMERO DE OT / PROYECTO"` | Sí |
| **Nombre Operador** | `textField` | `type: "textField"`, `label: "NOMBRE OPERADOR"` | Sí |
| **Categoría del Equipo** | `comboBox` | `values: { quest: "CATEGORÍA DEL EQUIPO", selected: "", options: [...] }` | Sí |
| **Subcategoría del Equipo** | `comboBox` | `values: { quest: "SUBCATEGORÍA DEL EQUIPO", selected: "", options: [...] }` | Sí |
| **Placa Patente** | `comboBox` | `values: { quest: "PLACA PATENTE", selected: "", options: [...] }` | Sí |

*(Nota: La Fecha de Inspección y el Nombre del Inspector corresponden a metadata del sistema y del usuario autenticado).*

### 2.1. Contrato Canónico de ComboBox
```json
{
  "type": "comboBox",
  "label": "TIPO DE MOVIMIENTO",
  "default": "",
  "values": {
    "quest": "TIPO DE MOVIMIENTO",
    "selected": "",
    "options": [
      { "id": "ENTRADA", "label": "ENTRADA", "value": "ENTRADA" },
      { "id": "SALIDA", "label": "SALIDA", "value": "SALIDA" }
    ]
  }
}
```

---

## 🚜 3. Segmento 2: Generalidades de Estado (Cabina e Iluminación)
> **Tipo de Evaluación:** `B` (Bueno) / `R` (Regular) / `M` (Malo) / `NA` (No Aplica) + Observación condicional + 📸 Fotos.

### Contrato Canónico FotoCheck Estado
```json
{
  "type": "photoCheck",
  "label": "Estado de cabina",
  "default": "",
  "galeria": [],
  "obs": "",
  "options": [
    { "id": "B", "label": "B" },
    { "id": "R", "label": "R" },
    { "id": "M", "label": "M" },
    { "id": "NA", "label": "NA" }
  ],
  "compression": 10
}
```

| Ítem de Inspección | Evaluación | Foto Requerida |
| :--- | :--- | :--- |
| **Estado de cabina** | `B / R / M / NA` | 📸 **Obligatoria** |
| **Estado de peldaños** | `B / R / M / NA` | Opcional |
| **Estado de vidrios** | `B / R / M / NA` | Opcional |
| **Estado de asiento** | `B / R / M / NA` | Opcional |
| **Cinturón de Seguridad** | `B / R / M / NA` | Opcional |
| **Luces Delanteras** | `B / R / M / NA` | 📸 **Obligatoria** |
| **Luces Traseras** | `B / R / M / NA` | 📸 **Obligatoria** |
| **Luces de Intermitente** | `B / R / M / NA` | Opcional |
| **Luces de Estacionamiento** | `B / R / M / NA` | Opcional |
| **Luz de Retroceso** | `B / R / M / NA` | Opcional |
| **Alarma de retroceso** | `B / R / M / NA` | Opcional |
| **Bocina** | `B / R / M / NA` | Opcional |
| **Foco Faenero** | `B / R / M / NA` | Opcional |
| **Estado de puertas** | `B / R / M / NA` | Opcional |
| **Estado de frenos** | `B / R / M / NA` | Opcional |
| **Estado de Tapa de estanque de Combustible** | `B / R / M / NA` | Opcional |
| **Estado de neumáticos y presión de aire** | `B / R / M / NA` | 📸 **Obligatoria** |

---

## 🧰 4. Segmento 3: Generalidades de Equipamiento y Apoyo
> **Tipo de Evaluación:** `B` / `R` / `M` / `NA` + **Cantidad e Indicador de Unidad (`unit`)** + Observación condicional + 📸 Fotos.

### Contrato Canónico FotoCheck con Cantidad y Unidad
```json
{
  "type": "photoCheck",
  "label": "Contrapeso",
  "default": "",
  "hasCantidad": true,
  "cantidad": null,
  "unit": "Ton.",
  "galeria": [],
  "obs": "",
  "options": [
    { "id": "B", "label": "B" },
    { "id": "R", "label": "R" },
    { "id": "M", "label": "M" },
    { "id": "NA", "label": "NA" }
  ],
  "compression": 10
}
```

| Ítem de Inspección | Evaluación | Cantidad / Unidad | Foto Requerida |
| :--- | :--- | :--- | :--- |
| **Espejos** | `B / R / M / NA` | Numérico | Opcional |
| **Medidor de presión de aire y Manguera** | `B / R / M / NA` | Numérico | Opcional |
| **Neumático de Repuesto** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Base de apoyo (almohadillas)** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Contrapeso** | `B / R / M / NA` | Numérico (`Ton.`) | 📸 **Obligatoria** |
| **Tabla de Carga** | `B / R / M / NA` | Numérico | Opcional |
| **Tacógrafo** | `B / R / M / NA` | Numérico | Opcional |
| **Tablones piso Cama baja** | `B / R / M / NA` | Numérico | Opcional |
| **Balde / Horquilla** | `B / R / M / NA` | Numérico | Opcional |

---

## ⛓️ 5. Segmento 4: Elementos de Maniobras e Izaje
> **Tipo de Evaluación:** `B` / `R` / `M` / `NA` + **Cantidad / Unidad** + Observación condicional + 📸 Fotos.

| Ítem de Inspección | Evaluación | Cantidad / Unidad | Foto Requerida |
| :--- | :--- | :--- | :--- |
| **Estado de Enrollado del Cable** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Eslingas de Amarre** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Trapas o Chicharra** | `B / R / M / NA` | Numérico | Opcional |
| **Cadena** | `B / R / M / NA` | Numérico (`mts`) | 📸 **Obligatoria** |
| **Tensores Chicharra** | `B / R / M / NA` | Numérico | Opcional |
| **Tensor Manual** | `B / R / M / NA` | Numérico | Opcional |
| **Eslingas** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Pulpo de Cadena** | `B / R / M / NA` | Numérico (`Ton.`) | 📸 **Obligatoria** |
| **Grilletes** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Gancho principal** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Seguro de Gancho** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Lienzo de Viento** | `B / R / M / NA` | Numérico | Opcional |
| **Trinquetes** | `B / R / M / NA` | Numérico | Opcional |
| **Winches** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Estructura JIB** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |
| **Pasadores JIB** | `B / R / M / NA` | Numérico | 📸 **Obligatoria** |

---

## 🦺 6. Segmento 5: Insumos de Seguridad
> **Tipo de Evaluación:** `SI` / `NO` / `NA` + **Cantidad / Unidad** + Observación condicional + 📸 Fotos.

* **Botiquín** (`SI/NO/NA`, Cantidad)
* **Cuñas** (`SI/NO/NA`, Cantidad)
* **Baliza** (`SI/NO/NA`, Cantidad)
* **Triángulo** (`SI/NO/NA`, Cantidad)
* **Llave de Rueda (+ barrote)** (`SI/NO/NA`, Cantidad)
* **Gata** (`SI/NO/NA`, Cantidad con `unit: "Ton."`)
* **Conos** (`SI/NO/NA`, Cantidad)
* **Grasera** (`SI/NO/NA`, Cantidad)

---

## 🧯 7. Segmento 6: Protección Contra Incendios
> **Tipo de Evaluación:** `SI` / `NO` / `NA` + **Fecha de Vencimiento (`hasVencimiento: true`)** + Observación condicional + 📸 Fotos.

### Contrato Canónico FotoCheck con Fecha de Vencimiento
```json
{
  "type": "photoCheck",
  "label": "Extintor Certificado",
  "default": "",
  "hasVencimiento": true,
  "fechaVencimiento": "",
  "galeria": [],
  "obs": "",
  "options": [
    { "id": "SI", "label": "SI" },
    { "id": "NO", "label": "NO" },
    { "id": "NA", "label": "NA" }
  ],
  "compression": 10
}
```

* **Extintor Certificado** (`SI/NO/NA` + Selector de Fecha `DD/MM/YYYY` + Foto)
* **Tipo de Extintor** (ComboBox: PQS, CO2, etc.)

---

## 📄 8. Segmento 7: Documentación de la Maquinaria
> **Tipo de Evaluación:** `SI` / `NO` / `NA` + **Fecha de Vencimiento (`hasVencimiento: true`)** + Observación condicional + 📸 Fotos Obligatorias.

* **Licencia de Conducir del Operador** (`SI/NO/NA` + Vencimiento + Foto)
* **Revisión Técnica** (`SI/NO/NA` + Vencimiento + Foto)
* **Permiso de Circulación** (`SI/NO/NA` + Vencimiento + Foto)
* **Seguro Obligatorio (SOAP)** (`SI/NO/NA` + Vencimiento + Foto)
* **Certificación Anual de Maquinaria / Equipo** (`SI/NO/NA` + Vencimiento + Foto)

---

## ✍️ 9. Segmento 8: Cierre y Firmas
* **Observaciones Generales:** `textArea` multilínea.
* **Firma del Operador:** `signatureCapture` (Firma digital obligatoria).

