# Ficha de Soporte & Resolución de Incidente Crítico

## 1. Ficha del Incidente
- **ID del Caso:** `CASO-20261117-02`
- **Fecha / Hora:** 2026-11-17 18:30 (-03:00)
- **Operador / Usuario Afectado:** Control Operativo / Gerencia de Operaciones (Negocio `GSP-2611-00029`, Proyecto 75, "PLANTA INDUSTRIALIZADORA SYGMA")
- **Negocio / OT:** `GSP-2611-00029` (`id_proyecto = 75`)
- **Equipo Involucrado:** Grúa Telescópica 70 Ton (`TLXF.37-9`, eq 39) y Grúa Horquilla 16 Ton (`GDZG.36-4`, eq 60)
- **Ambiente:** Producción (`PROD`)
- **Severidad:** Alta (Distorsión financiera severa en Informe de Término de Servicio: \$1.220.000 vs \$2.520.000 reales cotizados y calculados en EDP)

---

## 2. Síntoma Reportado por Terreno
Al revisar el negocio `GSP-2611-00029` en la plataforma web, el Informe de Término de Servicio (ITS) mostraba un monto total facturable distorsionado de aproximadamente \$1.220.000 a \$1.300.000 ("un palo tres"), mientras que:
1. La cotización comercial en CRM sumaba exactamente **\$2.520.000 CLP netos**.
2. La Carátula de Estado de Pago (EDP) calculaba correctamente **\$2.520.000 CLP netos**.
3. Se generaba una discrepancia de más de \$1.300.000 CLP entre el EDP y el ITS.

---

## 3. Diagnóstico Técnico & Evidencia Empírica
Al realizar la auditoría forense sobre la base de datos de producción (`sch_leangsp_prod`) y el controlador `itsController.js`:

1. **Estructura Comercial Real del Negocio (`tpry_linea_servicio`):**
   - Línea 0: Traslado Grúa 70 Ton = \$500.000 (Traslado Ida/Vuelta)
   - Línea 1: Grúa 70 Ton (`TLXF.37-9`) = 8 hrs @ \$110.000 = \$880.000 (Horas Diarias Mínimas)
   - Línea 2: Servicio Rigger Certificado = \$60.000 (Valor Fijo)
   - Línea 3: Grúa Horquilla 16 Ton (`GDZG.36-4`) = 8 hrs @ \$60.000 = \$480.000 (Horas Diarias Mínimas)
   - Línea 4: Traslado Grúa Horquilla = \$600.000 (Traslado Ida/Vuelta)
   - **Total Venta Neta Real:** **\$2.520.000 CLP**.

2. **Causa del Colapso en ITS:**
   - La presencia de la Línea 2 (Rigger) con `unidad: 'Valor Fijo'` (\$60.000) activó la bandera `esValorFijoComercial = true` en el backend, asignando `valorFijoPactado = 60000`.
   - La condición de jornadas en `itsController.js` evaluó `esValorFijoComercial || its.es_valor_fijo || valorFijoPactado > 0`, reclasificando erróneamente TODO el proyecto como contrato de suma alzada.
   - Como resultado:
     - La primera grúa (`TLXF.37-9`) recibió `subtotal = 60000` (el valor del Rigger).
     - Todas las demás grúas y jornadas posteriores (Horquilla `GDZG.36-4`) recibieron `subtotal = 0`.
     - Los fletes sumaron \$1.100.000.
     - Suma mostrada en web: \$1.100.000 + \$120.000 = **\$1.220.000 CLP** (pérdida visible de \$1.300.000).

3. **Por qué el EDP no falló:**
   - `estadoPagoController.js` calcula de forma pura iterando línea por línea la propuesta CRM, sin flags globales que sobreescriban tarifas de equipos con valores de servicios de personal.

---

## 4. Causa Raíz de Arquitectura
1. **Falta de Blindaje Anti-Degradación de Contratos por Hora:**
   En `itsController.js`, si un contrato contiene líneas horarias de grúa (`tieneLineaPorHora = true`), cualquier ítem complementario secundario con `VALOR FIJO` (Rigger, accesorios, permisos) debe tratarse como un adicional fijo (`valorAdicionalesFijosPactados`), y **bajo ninguna circunstancia** puede mutar el proyecto completo a `esValorFijoComercial = true`.
2. **Asimetría de Detección de Fletes:**
   El cálculo reactivo de cabecera solo evaluaba `.includes('flete')` en vez de `esJornadaTraslado(j)`, provocando inconsistencias en el balance de fletes vs horas.

---

## 5. Plan de Mitigación y Resolución Integral

Se ejecutaron ambas vías autorizadas:

### A. Saneamiento SQL en Base de Datos de Producción (`sch_leangsp_prod`)
Se recalibraron los registros del borrador `id_its = 14` en `tits_jornada_detalle` y `tits_informe_termino`:
- Fila 177 (`TLXF.37-9`, Grúa 70 Ton): `tipo_servicio = 'Hora'`, 8 hrs @ \$110.000 = **\$880.000**.
- Fila 178 (`KDYS.90-1`, Camión de Flete): `tipo_servicio = 'Registro de Viaje'`, subtotal = **\$0.00**.
- Fila 179 (`GDZG.36-4`, Grúa Horquilla): `tipo_servicio = 'Hora'`, 8 hrs @ \$60.000 = **\$480.000**.
- Fila 180 (`PERSONAL`, Rigger): `tipo_servicio = 'Hora'`, 1 serv @ \$60.000 = **\$60.000**.
- Cabecera `tits_informe_termino`:
  - `total_ingresos_horas = 1420000.00`
  - `total_ingresos_fletes = 1100000.00`
  - `total_ingresos_facturables = 2520000.00`
  - `utilidad_bruta = 2433654.81`
  - `margen_porcentaje = 96.57%`

### B. Corrección Quirúrgica en Backend de Producción (`itsController.js`)
1. Inclusión de `valorAdicionalesFijosPactados` para que ítems con `VALOR FIJO` secundarios (Rigger) se acumulen como adicionales sin degradar el contrato horario.
2. Inclusión de la condición `if (!tieneLineaPorHora && (esValorFijoComercial || ...))` para que jamás se sobreescriban a \$0 las jornadas de grúas cuando existen tarifas horarias pactadas.
3. Inclusión de la función canónica `esJornadaTraslado(j)` con manejo determinista seguro de valores cero (`Number(j.subtotal) !== null ? subtotal : fallback`).

---

## 6. Verificación Empírica E2E en Producción
Se ejecutó prueba en vivo contra el backend productivo PM2 ID 13 (`lean-services-gsp-prod`) vía endpoint HTTP autenticado `GET /api/operaciones/its/75`:

```
HTTP STATUS: 200 OK
id_its: 14
folio_its: ITS-GSP-2611-00029-001
es_valor_fijo: false
valor_hora_pactado: 110000.00
valor_flete_pactado: 1100000
total_horas_report: 17
total_ingresos_horas: 1420000
total_ingresos_fletes: 1100000
total_ingresos_facturables: 2520000
total_costos_operacionales: 86345.19
utilidad_bruta: 2433654.81
margen_porcentaje: 96.57%

Jornadas:
1. 2026-11-16 | TLXF.37-9 | TRASLADO IDA/VUELTA | Tarifa: 1100000 | Subtotal: 1100000
2. 2026-11-16 | TLXF.37-9 | Hora                | Tarifa: 110000  | Subtotal: 880000
3. 2026-11-16 | KDYS.90-1 | Registro de Viaje   | Tarifa: 0       | Subtotal: 0
4. 2026-11-17 | GDZG.36-4 | Hora                | Tarifa: 60000   | Subtotal: 480000
5. 2026-11-17 | PERSONAL  | Hora                | Tarifa: 60000   | Subtotal: 60000
```
**Consistencia Triangular Lograda:** Cotización (\$2.520.000) = EDP (\$2.520.000) = ITS (\$2.520.000).

---

## 7. Protocolo de Respuesta al Usuario
> *"El caso del ITS para el Negocio 00029 (Planta Sygma) quedó 100% resuelto y saneado en producción. Se corrigió la causa raíz en el backend para evitar que ítems fijos como el Rigger degraden a suma alzada contratos por hora, y se sanearon las jornadas en base de datos. Al ingresar a la plataforma web, el ITS refleja exactamente \$2.520.000 CLP netos, en perfecta concordancia triangular con la cotización y el Estado de Pago."*
