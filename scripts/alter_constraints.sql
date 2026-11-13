ALTER TABLE sch_leangsp.tits_jornada_detalle DROP CONSTRAINT IF EXISTS tits_jornada_detalle_tipo_servicio_check;
ALTER TABLE sch_leangsp.tits_jornada_detalle ADD CONSTRAINT tits_jornada_detalle_tipo_servicio_check 
  CHECK (tipo_servicio IN ('Hora', 'Mensual', 'Fijo', 'Valor Fijo', 'Valor Fijo / Jornada', 'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 'Visita Terreno', 'Interno'));

ALTER TABLE sch_leangsp_prod.tits_jornada_detalle DROP CONSTRAINT IF EXISTS tits_jornada_detalle_tipo_servicio_check;
ALTER TABLE sch_leangsp_prod.tits_jornada_detalle ADD CONSTRAINT tits_jornada_detalle_tipo_servicio_check 
  CHECK (tipo_servicio IN ('Hora', 'Mensual', 'Fijo', 'Valor Fijo', 'Valor Fijo / Jornada', 'Flete Ida y Retorno', 'Flete Solo Ida', 'Flete Solo Retorno', 'Visita Terreno', 'Interno'));
