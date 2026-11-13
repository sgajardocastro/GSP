-- =============================================================================
-- FIX TRIGGER FUNCTION fn_chk_cierre_ot
-- Separar validación por tabla para evitar error de campo "estado" en tmnt_ot_cierre
-- =============================================================================

CREATE OR REPLACE FUNCTION sch_leangsp.fn_chk_cierre_ot()
RETURNS TRIGGER AS $$
DECLARE
    v_actividades_pendientes INT;
    v_repuestos_pendientes INT;
BEGIN
    -- Validar Update sobre tmnt_ot
    IF TG_TABLE_NAME = 'tmnt_ot' THEN
        IF NEW.estado = 'CERRADA' AND (OLD.estado IS NULL OR OLD.estado != 'CERRADA') THEN
            SELECT COUNT(*) INTO v_actividades_pendientes
            FROM sch_leangsp.tmnt_ot_actividad
            WHERE id_ot = NEW.id_ot AND estado != 'COMPLETADA';

            IF v_actividades_pendientes > 0 THEN
                RAISE EXCEPTION 'No se puede cerrar la OT % porque tiene actividades pendientes.', NEW.numero_ot;
            END IF;

            -- Solo validar entrega si es producto WMS (id_producto no nulo)
            SELECT COUNT(*) INTO v_repuestos_pendientes
            FROM sch_leangsp.tmnt_ot_repuesto
            WHERE id_ot = NEW.id_ot 
              AND id_producto IS NOT NULL 
              AND cantidad_solicitada IS NOT NULL 
              AND COALESCE(cantidad_entregada, 0) < cantidad_solicitada;

            IF v_repuestos_pendientes > 0 THEN
                RAISE EXCEPTION 'No se puede cerrar la OT % porque tiene repuestos de bodega pendientes de entrega.', NEW.numero_ot;
            END IF;
        END IF;

    -- Validar Insert sobre tmnt_ot_cierre
    ELSIF TG_TABLE_NAME = 'tmnt_ot_cierre' THEN
        SELECT COUNT(*) INTO v_actividades_pendientes
        FROM sch_leangsp.tmnt_ot_actividad
        WHERE id_ot = NEW.id_ot AND estado != 'COMPLETADA';

        IF v_actividades_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede registrar el cierre de la OT (ID: %) porque tiene actividades pendientes.', NEW.id_ot;
        END IF;

        -- Solo validar entrega si es producto WMS (id_producto no nulo)
        SELECT COUNT(*) INTO v_repuestos_pendientes
        FROM sch_leangsp.tmnt_ot_repuesto
        WHERE id_ot = NEW.id_ot 
          AND id_producto IS NOT NULL 
          AND cantidad_solicitada IS NOT NULL 
          AND COALESCE(cantidad_entregada, 0) < cantidad_solicitada;

        IF v_repuestos_pendientes > 0 THEN
            RAISE EXCEPTION 'No se puede registrar el cierre de la OT (ID: %) porque tiene repuestos de bodega pendientes de entrega.', NEW.id_ot;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
