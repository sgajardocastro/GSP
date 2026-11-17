# Certificación QA End-to-End: Nuevo Ciclo Completo de Negocio (OT GSP-2611-00050)

- **ID Certificación:** `CERT-E2E-20261113-002`
- **Ambiente:** Desarrollo DEV (`https://servidor.leanglobal.cl/lg-gsp-dev/`)
- **Base de Datos:** PostgreSQL `sch_leangsp` (Puerto 5432)
- **Fecha de Ejecución:** 13 de Noviembre de 2026
- **Subagente Certificador QA:** `qa-business-specialist`
- **Mandante:** Sergio Gajardo / LeanGlobal Spa
- **Política de Persistencia:** CERO TEARDOWN (Todos los registros permanecen vivos en DEV)

---

## 1. Identificadores Oficiales del Ciclo Operativo

| Hito Operativo | Entidad / Tabla BD | Identificador Fáctico | Estado de Transición |
| :--- | :--- | :--- | :--- |
| **Proyecto / OT** | `sch_leangsp.tpry_proyecto` | `id_proyecto = 97` <br> Folio OT: **`GSP-2611-00050`** | **Estado 4 ("En Ejecución")** |
| **Estructura Comercial CRM** | `json_field->'crm_v1'` | 2 Servicios en Árbol con `primario` y `ramas` | Despliegue reactivo en CRM Web |
| **Líneas de Servicio** | `sch_leangsp.tpry_linea_servicio` | • Lin 1 (`147`): Izaje 70T ($880.000) <br> • Lin 2 (`151`): Traslado 70T ($750.000) <br> • Lin 3 (`153`): Camión Pluma ($520.000) <br> • Lin 4 (`154`): Traslado Pluma ($250.000) | Activas y Relacionadas (Neto: $2.400.000) |
| **Asignación de Equipos** | `sch_leangsp.tpry_rel_equipo` | • Grúa 70T (`id_rel_equipo = 66`, GPT-137, `VPSR.26-1`) <br> • Camión Pluma (`id_rel_equipo = 67`, CPA-91, `GVFX-24-5`) | Ligados a sus líneas respectivas bajo SPEC-131 |
| **Asignación Tripulación** | `sch_leangsp.tpry_rel_persona` | • Operador Grúa: Héctor Paredes (`id_rel_persona = 81`) <br> • Rigger Certificado: Andrés Urra (`id_rel_persona = 82`) <br> • Chofer / Operador Pluma: Víctor Márquez (`id_rel_persona = 83`) | Asignados formalmente con 8 hrs plan |
| **Desplazamiento / Viaje** | `sch_leangsp.tequ_log_desplazamiento` | `id_log_desplazamiento = 80` <br> Token: `vj-97-42-live` | **`ARRIBADO`** (Odómetro: 45.300 a 45.328 km) |
| **Report Diario Faena** | `sch_leangsp.tedp_reporte_avance` | `id_reporte_avance = 82` <br> Día 1: 8.00 hrs faena, Horómetro 3.461,10 a 3.469,10 | **`VALIDADO_ANALISTA`** (Firma Sergio Gajardo en base64) |
| **Estado de Pago (EDP)** | `sch_leangsp.tedp_estado_pago` <br> `tedp_estado_pago_detalle` | `id_edp = 4` <br> Folio: **`EDP-GSP-2611-00050-01`** | **`APROBADO_PARA_FACTURAR`** <br> Neto: $2.400.000 + IVA: $456.000 = Total: **$2.856.000** |
| **Término Servicio (ITS)** | `sch_leangsp.tits_informe_termino` <br> `tits_costo_operacional` | `id_its = 13` <br> Folio: **`ITS-GSP-2611-00050-001`** | **`CONCLUIDO`** <br> Ingresos: $2.400.000, Costos: $27.000, Utilidad: $2.373.000 (**98.88% margen**) |

---

## 2. Cuadratura Matemática y Financiera

### 2.1. Ingresos Brutos Facturables (EDP)
- **Servicio Izaje Grúa Telescópica 70T:** 8.00 hrs $\times$ $110.000/hr = **$880.000 CLP**
- **Flete Traslado Grúa 70T (Ida y Vuelta):** 1 Viaje Global = **$750.000 CLP**
- **Servicio Camión Pluma 10T:** 8.00 hrs $\times$ $65.000/hr = **$520.000 CLP**
- **Flete Traslado Camión Pluma (Ida y Vuelta):** 1 Viaje Global = **$250.000 CLP**
- **Subtotal Neto Facturable:** **$2.400.000 CLP**
- **IVA (19%):** **$456.000 CLP**
- **Monto Bruto Total EDP:** **$2.856.000 CLP**

### 2.2. Costos Operacionales y Margen (ITS)
- **Alimentación Operador Grúa (Héctor Paredes):** $9.000 CLP
- **Alimentación Rigger (Andrés Urra):** $9.000 CLP
- **Alimentación Operador Camión Pluma (Víctor Márquez):** $9.000 CLP
- **Total Costos Directos Imputados:** **$27.000 CLP**
- **Utilidad Bruta:** $2.400.000 - $27.000 = **$2.373.000 CLP**
- **Margen de Explotación:** $\frac{2.373.000}{2.400.000} \times 100 = \mathbf{98.88\%}$

---

## 3. URLs Directas para Verificación en Navegador (DEV)

1. **Torre de Control de Operaciones (Kanban, diff y OT en ejecución):**
   `https://servidor.leanglobal.cl/lg-gsp-dev/torre`
   *(Buscar OT `GSP-2611-00050` de LeanGlobal Spa en la columna "En Ejecución")*

2. **Consola PMO / Liquidación Operacional & Facturación:**
   `https://servidor.leanglobal.cl/lg-gsp-dev/torre` ➔ Activar pestaña **"Consola PMO"**
   *(Verificar OT `GSP-2611-00050` con `ITS-GSP-2611-00050-001` CONCLUIDO y EDP listo a facturar)*

3. **Portal Móvil Conductor (Viaje y Odómetros):**
   `https://servidor.leanglobal.cl/lg-gsp-dev/viaje/vj-97-42-live`

4. **Documento Oficial PDF del EDP (Generación viva en backend):**
   `https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/edp/proyecto/97/pdf`

5. **Documento Oficial PDF del ITS (Generación viva en backend):**
   `https://servidor.leanglobal.cl/lg-gsp-dev/api/operaciones/its/preview-pdf/97`
