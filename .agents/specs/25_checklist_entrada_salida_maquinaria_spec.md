# 📋 Especificación Técnica: Template Dinámico "Check List Entrada y Salida de Maquinarias" (GSP)

**Código del Template:** `TMPL-GSP-CHK-EQUIPOS`  
**Nombre del Template:** Check List Entrada y Salida de Equipos y Maquinarias  
**Id Empresa:** 9 (Grúas San Pablo)  
**Id Flujo (`id_flow_tmpl`):** 1 (FES_DIRECTA)  

---

## 1. ESTRUCTURA JSON DEL TEMPLATE (`tsrv_templates.json_template`)

```json
{
  "code": "TMPL-GSP-CHK-EQUIPOS",
  "title": "CHECK LIST MAQUINARIAS (ENTRADA / SALIDA)",
  "description": "Checklist de recepción y entrega de equipos, maniobras, seguridad y documentación",
  "version": "1.1",
  "segments": [
    {
      "title": "1. DATOS GENERALES DEL REGISTRO",
      "attributes": [
        {
          "name": "num_ot",
          "label": "Código del Proyecto / N° OT",
          "type": "textField",
          "required": true
        },
        {
          "name": "tipo_operacion",
          "label": "Tipo de Operación",
          "type": "comboBox",
          "options": ["ENTRADA", "SALIDA"],
          "required": true
        },
        {
          "name": "placa_patente",
          "label": "Placa Patente del Equipo",
          "type": "textField",
          "required": true
        },
        {
          "name": "categoria",
          "label": "Categoría del Equipo",
          "type": "textField",
          "required": true
        },
        {
          "name": "subcategoria",
          "label": "Subcategoría del Equipo",
          "type": "textField",
          "required": true
        },
        {
          "name": "nombre_operador",
          "label": "Nombre del Operador",
          "type": "textField",
          "required": true
        },
        {
          "name": "nombre_inspector",
          "label": "Nombre de Quien Inspecciona",
          "type": "textField",
          "required": true
        },
        {
          "name": "fotos_datos_generales",
          "label": "Fotografías de Datos Generales y Placa Patente",
          "type": "photoCapture",
          "required": false
        }
      ]
    },
    {
      "title": "2. GENERALIDADES DEL EQUIPO",
      "attributes": [
        {
          "name": "evaluacion_generalidades",
          "label": "Estado de Componentes Generales",
          "type": "matrizCheck",
          "columns": ["CANTIDAD", "BUENO", "REGULAR", "MALO", "N/A", "OBSERVACION"],
          "items": [
            "Estado de cabina",
            "Estado de peldaños",
            "Estado de vidrios",
            "Estado de asiento",
            "Cinturón de Seguridad",
            "Luces Delanteras",
            "Luces Traseras",
            "Luces de Intermitente",
            "Luces de Estacionamiento",
            "Luz de Retroceso",
            "Alarma retroceso",
            "Bocina",
            "Foco Faenero",
            "Estado de puertas",
            "Estado de frenos",
            "Estado de neumáticos y presión de aire",
            "Espejos",
            "Medidor de presión de aire y Manguera",
            "Neumático de Repuesto",
            "Base de apoyo (almohadillas)",
            "Contrapesos",
            "Tabla de Carga",
            "Estado de Tapa de estanque de Combustible",
            "Tacógrafo",
            "Tablones piso Cama baja",
            "Balde/Horquilla"
          ]
        },
        {
          "name": "contrapeso_toneladas",
          "label": "Contrapeso (Toneladas)",
          "type": "textField",
          "required": false
        },
        {
          "name": "fotos_generalidades",
          "label": "Fotografías de Generalidades del Equipo",
          "type": "photoCapture",
          "required": false
        }
      ]
    },
    {
      "title": "3. MANIOBRAS Y ELEMENTOS DE IZAJE",
      "attributes": [
        {
          "name": "evaluacion_maniobras",
          "label": "Estado de Elementos de Maniobra",
          "type": "matrizCheck",
          "columns": ["CANTIDAD", "BUENO", "REGULAR", "MALO", "N/A", "OBSERVACION"],
          "items": [
            "Estado de Enrollado del Cable",
            "Eslingas de Amarre",
            "Trapas o Chicharra",
            "Cadena de Amarre",
            "Tensores Chicharra",
            "Tensor Manual",
            "Eslingas Sintéticas",
            "Pulpo de Cadena",
            "Grilletes",
            "Gancho principal",
            "Seguro Gancho",
            "Lienzo de Viento",
            "Trinquetes",
            "Winches",
            "Estructura JIB",
            "Pasadores JIB"
          ]
        },
        {
          "name": "cadena_medidas",
          "label": "Cadena (Metros y Medidas)",
          "type": "textField",
          "required": false
        },
        {
          "name": "pulpo_cadena_espec",
          "label": "Pulpo de Cadena (Ramales y Toneladas)",
          "type": "textField",
          "required": false
        },
        {
          "name": "fotos_maniobras",
          "label": "Fotografías de Elementos de Izaje y Maniobra",
          "type": "photoCapture",
          "required": false
        }
      ]
    },
    {
      "title": "4. INSUMOS DE SEGURIDAD",
      "attributes": [
        {
          "name": "evaluacion_insumos",
          "label": "Verificación de Insumos de Seguridad",
          "type": "matrizCheck",
          "columns": ["CANTIDAD", "SI", "NO", "N/A", "OBSERVACION"],
          "items": [
            "Botiquín",
            "Cuñas",
            "Baliza",
            "Triángulo",
            "Llave de Rueda (+ barrote)",
            "Gata Hidráulica",
            "Conos",
            "Grasera"
          ]
        },
        {
          "name": "gata_toneladas",
          "label": "Gata (Capacidad en Toneladas)",
          "type": "textField",
          "required": false
        },
        {
          "name": "fotos_insumos",
          "label": "Fotografías de Insumos de Seguridad",
          "type": "photoCapture",
          "required": false
        }
      ]
    },
    {
      "title": "5. PROTECCIÓN DE INCENDIOS",
      "attributes": [
        {
          "name": "extintor_certificado",
          "label": "Extintor Certificado",
          "type": "comboBox",
          "options": ["SI", "NO", "N/A"],
          "required": true
        },
        {
          "name": "extintor_vencimiento",
          "label": "Fecha Vencimiento Extintor",
          "type": "dateField",
          "required": false
        },
        {
          "name": "extintor_tipo",
          "label": "Tipo de Extintor (kg/agente)",
          "type": "textField",
          "required": false
        },
        {
          "name": "fotos_incendios",
          "label": "Fotografías de Sistemas / Extintor de Protección contra Incendios",
          "type": "photoCapture",
          "required": false
        }
      ]
    },
    {
      "title": "6. DOCUMENTACIÓN DEL EQUIPO",
      "attributes": [
        {
          "name": "evaluacion_documentos",
          "label": "Documentos del Vehículo / Maquinaria",
          "type": "matrizCheck",
          "columns": ["FECHA VENCIMIENTO", "SI", "NO", "N/A", "OBSERVACION"],
          "items": [
            "Licencia de Conducir",
            "Revisión Técnica",
            "Permiso de Circulación",
            "Seguro Obligatorio (SOAP)",
            "Certificación de Maquinaria / Equipo"
          ]
        },
        {
          "name": "fotos_documentos",
          "label": "Fotografías de Documentación del Equipo",
          "type": "photoCapture",
          "required": false
        }
      ]
    },
    {
      "title": "7. OBSERVACIONES GENERALES Y FIRMAS",
      "attributes": [
        {
          "name": "observaciones_generales",
          "label": "Observaciones Generales",
          "type": "textArea",
          "required": false
        },
        {
          "name": "fotos_observaciones",
          "label": "Fotografías Adicionales / Observaciones Generales",
          "type": "photoCapture",
          "required": false
        },
        {
          "name": "firma_operador",
          "label": "Firma del Operador",
          "type": "signatureCapture",
          "required": true
        },
        {
          "name": "firma_observador",
          "label": "Firma del Observador / Inspector",
          "type": "signatureCapture",
          "required": true
        },
        {
          "name": "firma_gerente_operaciones",
          "label": "V°B° Gerente de Operaciones",
          "type": "signatureCapture",
          "required": false
        }
      ]
    }
  ]
}
```
