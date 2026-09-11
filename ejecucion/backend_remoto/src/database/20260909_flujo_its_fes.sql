-- ============================================================================
-- Migración DDL: Flujo FES ITS (Spec 47)
-- Base de Datos: sch_leangsp (DEV)
-- ============================================================================

-- 1. Sembrar roles de GSP si no existen
INSERT INTO sch_leangsp.tsec_roles (name_rol, description, activo, id_empresa, flag_externo)
SELECT 'GSP_PROG', 'Analista de Operaciones GSP', true, 1, false
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_PROG');

INSERT INTO sch_leangsp.tsec_roles (name_rol, description, activo, id_empresa, flag_externo)
SELECT 'GSP_APROB', 'Jefe de Operaciones GSP', true, 1, false
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_APROB');

INSERT INTO sch_leangsp.tsec_roles (name_rol, description, activo, id_empresa, flag_externo)
SELECT 'GSP_CONTA', 'Contabilidad y Finanzas GSP', true, 1, false
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_CONTA');

-- 2. Sembrar Template de Flujo ITS (ID 90)
INSERT INTO sch_leangsp.tflw_templates (id_flow_tmpl, flow_tmpl_name, id_empresa, flow_tmpl_desc, flow_tmpl_estado)
SELECT 90, 'FLUJO ITS 3 PASOS', 1, 'Flujo de aprobación FES para Informe de Término de Servicio (Analista -> Jefatura -> Contabilidad)', 'A'
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_templates WHERE id_flow_tmpl = 90);

-- Pasos del Template 90
INSERT INTO sch_leangsp.tflw_template_steps (id_flow_tmpl, flow_tmpl_step_orden, flow_tmpl_step_fase, flow_tmpl_step_name, obligatorio, id_rol, flag_flow_fin, flag_equipo)
SELECT 90, 1, 'ELABORACION', 'Elaboración & Liquidación Técnica', true, (SELECT id_rol FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_PROG' LIMIT 1), false, false
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_template_steps WHERE id_flow_tmpl = 90 AND flow_tmpl_step_orden = 1);

INSERT INTO sch_leangsp.tflw_template_steps (id_flow_tmpl, flow_tmpl_step_orden, flow_tmpl_step_fase, flow_tmpl_step_name, obligatorio, id_rol, flag_flow_fin, flag_equipo)
SELECT 90, 2, 'APROBACION', 'V°B° Jefatura de Operaciones', true, (SELECT id_rol FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_APROB' LIMIT 1), false, false
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_template_steps WHERE id_flow_tmpl = 90 AND flow_tmpl_step_orden = 2);

INSERT INTO sch_leangsp.tflw_template_steps (id_flow_tmpl, flow_tmpl_step_orden, flow_tmpl_step_fase, flow_tmpl_step_name, obligatorio, id_rol, flag_flow_fin, flag_equipo)
SELECT 90, 3, 'RECEPCION', 'Recepción Conforme Contabilidad', true, (SELECT id_rol FROM sch_leangsp.tsec_roles WHERE name_rol = 'GSP_CONTA' LIMIT 1), true, false
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_template_steps WHERE id_flow_tmpl = 90 AND flow_tmpl_step_orden = 3);

-- 3. Ampliar y sembrar Catálogo de Motivos de Rechazo
ALTER TABLE sch_leangsp.tflw_motivo_rechazo 
  ALTER COLUMN motivo_rechazo TYPE VARCHAR(150);

INSERT INTO sch_leangsp.tflw_motivo_rechazo (motivo_rechazo, id_empresa, fecha_creacion)
SELECT 'Inconsistencia en horas facturables', 1, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_motivo_rechazo WHERE motivo_rechazo = 'Inconsistencia en horas facturables');

INSERT INTO sch_leangsp.tflw_motivo_rechazo (motivo_rechazo, id_empresa, fecha_creacion)
SELECT 'Falta comprobante o respaldo OC de costos', 1, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_motivo_rechazo WHERE motivo_rechazo = 'Falta comprobante o respaldo OC de costos');

INSERT INTO sch_leangsp.tflw_motivo_rechazo (motivo_rechazo, id_empresa, fecha_creacion)
SELECT 'Margen operacional inferior al mínimo pactado', 1, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_motivo_rechazo WHERE motivo_rechazo = 'Margen operacional inferior al mínimo pactado');

INSERT INTO sch_leangsp.tflw_motivo_rechazo (motivo_rechazo, id_empresa, fecha_creacion)
SELECT 'Discrepancia en tarifa pactada o flete', 1, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_motivo_rechazo WHERE motivo_rechazo = 'Discrepancia en tarifa pactada o flete');

INSERT INTO sch_leangsp.tflw_motivo_rechazo (motivo_rechazo, id_empresa, fecha_creacion)
SELECT 'Otro motivo (especificado en observaciones)', 1, CURRENT_DATE
WHERE NOT EXISTS (SELECT 1 FROM sch_leangsp.tflw_motivo_rechazo WHERE motivo_rechazo = 'Otro motivo (especificado en observaciones)');

-- 4. Extender sch_leangsp.tits_informe_termino
ALTER TABLE sch_leangsp.tits_informe_termino
  ADD COLUMN IF NOT EXISTS id_flow INT REFERENCES sch_leangsp.tflw_flows(id_flow),
  ADD COLUMN IF NOT EXISTS id_doc_pdf_actual INT REFERENCES sch_leangsp.tfmg_archivo(id_archivo),
  ADD COLUMN IF NOT EXISTS codigo_validacion_fes VARCHAR(64);

ALTER TABLE sch_leangsp.tits_informe_termino 
  DROP CONSTRAINT IF EXISTS tits_informe_termino_estado_its_check;

ALTER TABLE sch_leangsp.tits_informe_termino 
  ADD CONSTRAINT tits_informe_termino_estado_its_check
  CHECK (estado_its IN (
    'BORRADOR', 
    'ELABORADO', 
    'APROBADO_OPERACIONES', 
    'RECIBIDO_CONTABILIDAD',
    'EN_REVISION_OPERACIONES', 
    'EN_REVISION_CONTABILIDAD', 
    'CONCLUIDO', 
    'EN_CORRECCION'
  ));
