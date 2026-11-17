# SPEC-130: Sincronización Canónica de Ingresos, P&L Operacional y Fletes en Consola Web ITS vs Backend / EDP

> [!IMPORTANT]
> **NOTA DE REMISIÓN CANÓNICA A SPEC-16 §28:**
> Los lineamientos y reglas de esta especificación histórica han sido unificados y consolidados formalmente en la fuente canónica de verdad: **[.agents/specs/16_crm_gestor_oportunidades_spec.md](file:///d:/SGajardo/Google%20Drive/Antigravity/Grúas%20San%20Pablo/Propuesta%20Gestión%20Operación%20Grúas/.agents/specs/16_crm_gestor_oportunidades_spec.md#L1403-L1476) (Sección 28: Erradicación Integral de `json_field` desde Asignación hasta Facturación y Blindaje Canónico en 4 Niveles)**. Para cualquier consulta o implementación, rige prioritariamente `SPEC-16 §28`.

## 1. Identificación y Estado
- **ID:** `SPEC-130`
- **Requerimiento Asociado:** `REQ-1173` / `SPEC-129` (Matriz Maestra de 33 Casos - Estructura de Árbol por Servicios y Arriendos Multidía).
- **Módulos Afectados:** `ejecucion/frontend/src/components/Operaciones/ModalITS.vue`, `ejecucion/frontend/src/views/Operaciones/ItsTransicionView.vue`.
- **Estado:** `VIGENTE / APROBADO`
- **Fecha:** `2026-11-14`
- **Autor:** Equipo de Arquitectura de Software & QA E2E LeanGlobal (GSP).

---

## 2. Contexto y Problema Crítico Detectado ("El Desfase Web vs PDF")
Durante la certificación E2E de la Matriz Maestra de 33 Casos (Proyecto 167 / `GSP-2611-00109`, Cliente: Besalco Construcciones S.A.), se detectó una discrepancia severa entre la visualización en la interfaz Web (`ModalITS.vue`) y el documento oficial PDF emitido por el Backend (`preview-pdf/167`):

| Variable Financiera | Web UI (`ModalITS.vue`) | Backend / PDF Oficial | Discrepancia |
| :--- | :---: | :---: | :---: |
| **Ingresos Horas Faena** | `$ 2.350.000` | `$ 1.250.000` (5h × $250.000) | `+$ 1.100.000` |
| **Horas Visualizadas** | `09:00h` *(Falso)* | `8:00h` (Ajustado a 5h) | `+1:00h` (Traslado sumado como faena) |
| **Ingreso Fletes** | `$ 350.000` | `$ 350.000` | Duplicado (sumado en horas y en flete) |
| **Otros Ítems EDP (Permiso Municipal)** | `$ 0` *(Omitido)* | `$ 80.000` | `-$ 80.000` |
| **TOTAL INGRESOS FACTURABLES** | **`$ 2.700.000`** | **`$ 1.680.000`** | **`+$ 1.020.000 (+60.7%)`** |
| **Utilidad Bruta (P&L)** | `$ 2.648.000` | `$ 1.628.000` | `+$ 1.020.000` |
| **Margen Operacional** | `98.1%` | `96.9%` | `+1.2%` |

### Incoherencia Aritmética Interna en la Web:
La tarjeta de P&L de la Web mostraba:
`1. Ingresos Horas Trabajadas (09:00h × $ 250.000): $ 2.350.000`
Aritméticamente, $9 \times \$250.000 = \$2.250.000$. Había una inconsistencia visible de $\$100.000$ en el mismo renglón.

---

## 3. Causa Raíz (Análisis de Código)
El Backend (`itsController.js`) y el servicio de PDF (`itsPdfService.js`) implementan la lógica de negocio canónica del ERP:
1. Reconocen traslados mediante `esJornadaTraslado(j)` con la condición: `tsLow.includes('flete') || tsLow.includes('traslado') || nr === 'TRASLADO' || nr.startsWith('FLE-')`.
2. Reconcilian los ingresos facturables con los ajustes de Control de Gestión (`edp_ajustes_v1`) y el canon comercial de contratos mensuales o Rental 360.
3. El endpoint `GET /api/operaciones/its/:id` entrega `res.data.data.its.total_ingresos_facturables` perfectamente conciliado ($1.680.000).

Sin embargo, en el Frontend (`ModalITS.vue`):
1. **Asimetría en la detección de traslados:** Línea 2867 buscaba `tipo === 'Traslado'`. La jornada proveniente del backend tenía `tipo_servicio = 'TRASLADO IDA/VUELTA'`. Al no ser idéntico ni contener `'flete'`, el frontend la trató como **grúa de faena**. Le sumó 1h al contador de horas de grúa (8h + 1h = 9h) y sumó los $350.000$ al ingreso de horas ($2.000.000 + $350.000 = $2.350.000$).
2. **Duplicación de flete:** Como `totalIngFletes` quedó en $0 en el acumulador, la línea 2929 aplicó el fallback: `its.value.total_ingresos_fletes = parseFloat(its.value.valor_flete_pactado || 0) = $350.000`. Sumó el flete dos veces: una dentro de las horas de grúa y otra como ítem de flete ($2.350.000 + $350.000 = $2.700.000).
3. **Pisotoneo de la Verdad Canónica:** Inmediatamente tras cargar los datos del backend en `cargarITS()`, la línea 2595 ejecutaba `recalcularTotales()`, sobreescribiendo violentamente los valores oficiales del backend con el cálculo client-side desfasado.

---

## 4. Auditoría de Impacto Sistémico en los 10 Arquetipos

| Arquetipo | Proyecto | Cliente / Régimen | Web Antigua | Backend / PDF Oficial | Estado Previo |
| :--- | :---: | :--- | :---: | :---: | :---: |
| **ARQ-01** | 158 | Monticello (Valor Fijo) | `$ 1.000.000` | `$ 1.000.000` | COINCIDE ($0) |
| **ARQ-02** | 159 | Minería (Piso 8h + Examen Altura) | `$ 360.000` | `$ 1.680.000` | **FALLA (-$1.320.000)** |
| **ARQ-03** | 160 | Molyb (Horas + Standby) | `$ 1.080.000` | `$ 1.080.000` | COINCIDE ($0) |
| **ARQ-04** | 161 | Arriendo Mensual 180h | `$ 300.000` | `$ 7.500.000` | **FALLA (-$7.200.000)** |
| **ARQ-05** | 162 | Rental 360 Cama Baja (Km) | `$ 1.850.000` | `$ 2.154.000` | **FALLA (-$304.000)** |
| **ARQ-06** | 163 | Rental 360 Batería B (Standby) | `$ 0` | `$ 780.000` | **FALLA (-$780.000)** |
| **ARQ-07** | 164 | Solo Fletes Tracto (2 viajes) | `$ 1.840.000` | `$ 920.000` | **FALLA (+$920.000)** |
| **ARQ-08** | 165 | Visita Técnica Terreno | `$ 300.000` | `$ 300.000` | COINCIDE ($0) |
| **ARQ-09** | 166 | Mantención Taller Interno | `$ 0` | `$ 0` | COINCIDE ($0) |
| **ARQ-10** | 167 | Besalco (Ajuste Manual EDP) | `$ 2.700.000` | `$ 1.680.000` | **FALLA (+$1.020.000)** |

---

## 5. Especificación de la Solución Técnica

### 5.1. Regla Canónica de Detección de Traslados en Frontend
Homologar la función `esJornadaTraslado` en `ModalITS.vue` idéntica a la del backend:
```javascript
const esJornadaTraslado = (j) => {
  if (!j || typeof j !== 'object') return false;
  const ts = String(j.tipo_servicio || '').trim();
  if (ts === 'Registro de Viaje') return false;
  const tsLow = ts.toLowerCase();
  const nr = String(j.numero_report || '').trim().toUpperCase();
  return tsLow.includes('flete') || tsLow.includes('traslado') || nr === 'TRASLADO' || nr.startsWith('FLE-');
};
```

### 5.2. Respeto Incondicional a la Verdad Canónica de Facturación
En `recalcularTotales()`:
1. Si el backend ya entregó una Venta Neta Facturable consolidada (`backendFacturable > 0`) originada en:
   - Ajustes de Control de Gestión (`edp_ajustes_v1`)
   - Contratos de Arriendo Mensual de Largo Plazo (Piso 180h / canon mensual)
   - Servicios Rental 360 (sin report diario tradicional)
   - Servicios con adicionales fijos homologados en backend
   El frontend **PRESERVA** `its.value.total_ingresos_facturables`, `its.value.total_ingresos_horas` y `its.value.total_ingresos_fletes` del backend.
2. Si el usuario modifica costos operacionales (alimentación, combustible, peajes, operadores), el frontend recalcula `total_costos_operacionales` y actualiza reactivamente:
   $$\text{utilidad\_bruta} = \text{total\_ingresos\_facturables} - \text{total\_costos\_operacionales}$$
   $$\text{margen\_porcentaje} = \left(\frac{\text{utilidad\_bruta}}{\text{total\_ingresos\_facturables}}\right) \times 100$$
3. Si en `edp_ajustes_v1` existen `otros_items` (ej. Permiso Municipal Especial), el frontend los visualiza explícitamente en el desglose de ingresos de la tarjeta P&L para garantizar total transparencia y cuadratura matemática visual.

---

## 6. Criterio de Aceptación y Certificación
- Cuadratura $0 CLP entre Web UI y PDF Oficial en los 10 Arquetipos de la Matriz Maestra (`158` al `167`).
- Eliminación total del emoji de grúa (`🏗️`) en todo el frontend.
- Cero errores en `npm run build` de Vite.
