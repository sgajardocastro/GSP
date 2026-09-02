const pool = require('../config/postgresPool');
const crypto = require('crypto');
const MessageModel = require('../models/messageModel');
const messageModel = new MessageModel();

/**
 * Helper para pre-sembrar datos de cliente, obra y contacto en el body_exec del Template 80
 */
function preSembrarBodyTemplate80(seedOrExec, proyecto, crm, contacto, observaciones) {
    let body = seedOrExec;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch (_) { body = { segmentos: [] }; }
    }
    if (!body || typeof body !== 'object') body = { segmentos: [] };
    if (!Array.isArray(body.segmentos)) body.segmentos = [];

    const dirObra = crm.obra_direccion || crm.direccion || proyecto.direccion || '';
    const nomObra = crm.obra_nombre || proyecto.nombre_proyecto || '';
    const cliNombre = proyecto.cliente_nombre || crm.cliente_nombre || '';
    const cliRut = proyecto.cliente_rut || crm.cliente_rut || '';
    const ctoNombre = contacto.nombre || crm.contacto_nombre || '';
    const ctoFono = contacto.telefono || crm.contacto_telefono || '';
    const ctoEmail = contacto.email || crm.contacto_email || '';
    const obsText = observaciones || crm.comentarios_visita_coordinador || 'No especificado';

    body.segmentos.forEach(seg => {
        if (Array.isArray(seg.attributes)) {
            // Filtrar campo innecesario de referencia
            seg.attributes = seg.attributes.filter(attr => {
                const l = (attr.label || '').toUpperCase();
                return !l.includes('REFERENCIA DE LA DIRECCION');
            });

            const segLabel = (seg.label || '').toUpperCase();
            const isGeneral = segLabel.includes('GENERAL') || segLabel.includes('DATOS GENERALES') || segLabel.includes('1.');

            if (isGeneral) {
                let hasComentariosCoord = false;
                seg.attributes.forEach(attr => {
                    const l = (attr.label || '').toUpperCase();
                    if ((l.includes('RAZON') || l.includes('SOCIAL')) && !l.includes('RUTA')) {
                        attr.default = cliNombre;
                    }
                    if ((l === 'RUT' || l.includes('RUT EMPRESA') || l.includes('RUT CLIENTE') || l.includes('RUT DEL CLIENTE')) && !l.includes('RUTA')) {
                        attr.default = cliRut;
                    }
                    if (l.includes('NOMBRE DE LA OBRA') || (l.includes('OBRA') && !l.includes('DIRECCION') && !l.includes('GEOLOCALIZACION'))) {
                        attr.default = nomObra;
                    }
                    if (l.includes('DIRECCION') || l.includes('DIRECCIÓN')) {
                        attr.default = dirObra;
                    }
                    if (l.includes('CONTACTO EN TERRENO') || (l.includes('CONTACTO') && !l.includes('TELEFONO') && !l.includes('CORREO') && !l.includes('ELECTRONICO'))) {
                        attr.default = ctoNombre;
                    }
                    if (l.includes('TELEFONO') || l.includes('TELÉFONO') || l.includes('CELULAR')) {
                        attr.default = ctoFono;
                    }
                    if (l.includes('CORREO') || l.includes('EMAIL') || l.includes('ELECTRÓNICO')) {
                        attr.default = ctoEmail;
                    }
                    if (l.includes('COMENTARIOS DEL COORDINADOR') || l.includes('INSTRUCCIONES DEL COORDINADOR') || l.includes('COMENTARIO')) {
                        attr.default = obsText;
                        hasComentariosCoord = true;
                    }
                    if (attr.type === 'geoLocation' && crm.coordenadas_mapa) {
                        attr.default = crm.coordenadas_mapa;
                    }
                });

                if (!hasComentariosCoord) {
                    seg.attributes.push({
                        label: 'COMENTARIOS DEL COORDINADOR',
                        type: 'textField',
                        nullable: true,
                        roles: ['SYSTEM'],
                        default: obsText
                    });
                }
            }
        }
    });

    return body;
}

/**
 * 1. GET /api/operaciones/visita/proyecto/:id_proyecto (y /api/visitas/proyecto/:id_proyecto)
 * Retorna todas las visitas (1:N) asociadas al proyecto consultando tsrv_survey
 */
const getVisitasProyecto = async (req, res) => {
    try {
        const { id_proyecto } = req.params;
        if (!id_proyecto) {
            return res.status(400).json({ error: "Falta id_proyecto" });
        }

        // 1. Obtener datos del proyecto para contexto de preventa y contacto sugerido
        const pryRes = await pool.query(`
            SELECT p.id_proyecto, p.nombre_proyecto, p.codi_proyecto, p.json_field, p.estado_solicitud_visita,
                   p.id_empresa_cliente, e.razon_social as cliente_nombre, e.rut_empresa as cliente_rut
            FROM sch_leangsp.tpry_proyecto p
            LEFT JOIN sch_leangsp.tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
            WHERE p.id_proyecto = $1
        `, [Number(id_proyecto)]);

        if (pryRes.rowCount === 0) {
            return res.status(404).json({ error: "Proyecto no encontrado" });
        }

        const pry = pryRes.rows[0];
        let jf = pry.json_field;
        if (typeof jf === 'string') {
            try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
        }
        const crm = jf?.crm_v1 || {};

        // 2. Obtener todas las visitas (1:N) asociadas a este proyecto con id_template = 80
        const surveyRes = await pool.query(`
            SELECT 
                s.id_survey,
                s.id_proyecto,
                s.id_template,
                s.id_user,
                s.estado_srv,
                s.header_exec,
                s.body_exec,
                s.fecha_plan_ini,
                s.fecha_plan_fin,
                s.fecha_real_ini,
                s.fecha_real_fin,
                s.latitud,
                s.longitud,
                s.fecha_upload,
                u.name_frst,
                u.apellido_pat,
                u.apellido_mat,
                u.email as tecnico_email,
                u.movil as tecnico_fono
            FROM sch_leangsp.tsrv_survey s
            LEFT JOIN sch_leangsp.tsec_users u ON s.id_user = u.id_user
            WHERE s.id_proyecto = $1 AND s.id_template = 80
            ORDER BY s.id_survey ASC
        `, [Number(id_proyecto)]);

        const visitas = surveyRes.rows.map((row, idx) => {
            let header = row.header_exec;
            if (typeof header === 'string') {
                try { header = JSON.parse(header); } catch (_) { header = {}; }
            }
            if (!header || typeof header !== 'object') header = {};

            const tecnicoNombre = row.name_frst 
                ? `${row.name_frst} ${row.apellido_pat || ''} ${row.apellido_mat || ''}`.trim()
                : 'Sin Asignar';

            const contactoObra = header.contacto_obra || {};

            return {
                id_survey: row.id_survey,
                nro_visita: header.nro_visita || (idx + 1),
                tipo_visita: header.tipo_visita || (idx === 0 ? 'INICIAL' : 'REPLANTEO_MANIOBRA'),
                origen: header.origen || 'OPERACIONES',
                estado_srv: row.estado_srv || 'PLANIFICADO',
                id_user: row.id_user,
                tecnico_nombre: tecnicoNombre,
                tecnico_email: row.tecnico_email,
                tecnico_fono: row.tecnico_fono,
                fecha_plan_ini: row.fecha_plan_ini,
                fecha_plan_fin: row.fecha_plan_fin,
                fecha_real_ini: row.fecha_real_ini,
                fecha_real_fin: row.fecha_real_fin,
                contacto_nombre: contactoObra.nombre || crm.contacto_nombre || null,
                contacto_telefono: contactoObra.telefono || crm.contacto_telefono || null,
                contacto_email: contactoObra.email || crm.contacto_email || null,
                observaciones: header.observaciones || header.justificacion || '',
                historial_asignaciones: header.historial_asignaciones || [],
                pdf_url: `/api/servicio/exportar/${row.id_survey}`,
                latitud: row.latitud,
                longitud: row.longitud
            };
        });

        const visitaSolicitadaComercial = Boolean(
            crm.visita_terreno === true || 
            crm.visita_terreno === 'true' || 
            (pry.estado_solicitud_visita && pry.estado_solicitud_visita !== 'SIN_SOLICITAR')
        );

        return res.status(200).json({
            success: true,
            data: {
                id_proyecto: pry.id_proyecto,
                nombre_proyecto: pry.nombre_proyecto,
                codi_proyecto: pry.codi_proyecto,
                cliente_nombre: pry.cliente_nombre,
                cliente_rut: pry.cliente_rut,
                estado_solicitud_visita: pry.estado_solicitud_visita,
                visita_solicitada_comercial: visitaSolicitadaComercial,
                contacto_sugerido: {
                    nombre: crm.contacto_nombre || null,
                    telefono: crm.contacto_telefono || null,
                    email: crm.contacto_email || null
                },
                visitas
            }
        });
    } catch (err) {
        console.error("Error en getVisitasProyecto:", err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * 2. POST /api/operaciones/visita/asignar-web
 * Asigna técnico y fecha a una visita a terreno directamente desde la consola web
 */
const asignarVisitaWeb = async (req, res) => {
    try {
        const {
            id_proyecto,
            id_survey,
            id_user_tecnico,
            fecha_programada,
            contacto_nombre,
            contacto_telefono,
            contacto_email,
            observaciones
        } = req.body;

        if (!id_proyecto || !id_user_tecnico || !fecha_programada) {
            return res.status(400).json({ error: "Faltan parámetros requeridos: id_proyecto, id_user_tecnico y fecha_programada son obligatorios" });
        }

        // 1. Obtener proyecto y cliente
        const pryRes = await pool.query(`
            SELECT p.id_proyecto, p.nombre_proyecto, p.codi_proyecto, p.json_field, p.id_empresa_cliente,
                   e.razon_social as cliente_nombre, e.rut_empresa as cliente_rut
            FROM sch_leangsp.tpry_proyecto p
            LEFT JOIN sch_leangsp.tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
            WHERE p.id_proyecto = $1
        `, [Number(id_proyecto)]);

        if (pryRes.rowCount === 0) {
            return res.status(404).json({ error: "Proyecto no encontrado" });
        }

        const pry = pryRes.rows[0];
        let jf = pry.json_field;
        if (typeof jf === 'string') {
            try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
        }
        if (!jf || typeof jf !== 'object') jf = {};
        if (!jf.crm_v1) jf.crm_v1 = {};
        if (!jf.operaciones_v1) jf.operaciones_v1 = {};
        if (!Array.isArray(jf.operaciones_v1.visitas)) jf.operaciones_v1.visitas = [];

        const crm = jf.crm_v1;

        // 2. Obtener datos del técnico inspector
        const userRes = await pool.query(`
            SELECT id_user, name_frst, apellido_pat, apellido_mat, email, movil AS fono
            FROM sch_leangsp.tsec_users
            WHERE id_user = $1
        `, [Number(id_user_tecnico)]);

        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "Técnico inspector no encontrado" });
        }

        const tecnico = userRes.rows[0];
        const tecnicoNombre = `${tecnico.name_frst || ''} ${tecnico.apellido_pat || ''}`.trim();
        const asignadoPor = req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : 'Coordinador Operaciones Web';

        let resolvedSurveyId = id_survey ? Number(id_survey) : null;

        // Si no vino id_survey explícito, verificar si ya existe un survey PLANIFICADO/Creado para este proyecto
        if (!resolvedSurveyId) {
            const existingSrvRes = await pool.query(`
                SELECT id_survey FROM sch_leangsp.tsrv_survey 
                WHERE id_proyecto = $1 AND id_template = 80 AND estado_srv NOT IN ('EJECUTADO', 'CANCELADO')
                ORDER BY id_survey DESC LIMIT 1
            `, [Number(id_proyecto)]);
            if (existingSrvRes.rowCount > 0) {
                resolvedSurveyId = existingSrvRes.rows[0].id_survey;
            }
        }

        const contactoPayload = {
            nombre: contacto_nombre || crm.contacto_nombre || '',
            telefono: contacto_telefono || crm.contacto_telefono || '',
            email: contacto_email || crm.contacto_email || ''
        };

        if (resolvedSurveyId) {
            // Actualizar survey existente
            const srvRowRes = await pool.query(`
                SELECT header_exec, body_exec FROM sch_leangsp.tsrv_survey WHERE id_survey = $1
            `, [resolvedSurveyId]);

            let headerExec = {};
            let bodyExec = {};

            if (srvRowRes.rowCount > 0) {
                headerExec = srvRowRes.rows[0].header_exec;
                if (typeof headerExec === 'string') {
                    try { headerExec = JSON.parse(headerExec); } catch (_) { headerExec = {}; }
                }
                bodyExec = srvRowRes.rows[0].body_exec;
            }

            if (!headerExec || typeof headerExec !== 'object') headerExec = {};
            if (!Array.isArray(headerExec.historial_asignaciones)) headerExec.historial_asignaciones = [];

            headerExec.historial_asignaciones.push({
                id_user: Number(id_user_tecnico),
                tecnico_nombre: tecnicoNombre,
                fecha_asignacion: new Date().toISOString(),
                asignado_por: asignadoPor,
                tipo_accion: "ASIGNACION_WEB"
            });

            headerExec.contacto_obra = contactoPayload;
            headerExec.observaciones = observaciones || headerExec.observaciones || '';

            const bodyPoblado = preSembrarBodyTemplate80(bodyExec, pry, crm, contactoPayload, observaciones);

            await pool.query(`
                UPDATE sch_leangsp.tsrv_survey
                SET id_user = $1,
                    estado_srv = 'PLANIFICADO',
                    fecha_plan_ini = $2,
                    fecha_plan_fin = $2,
                    header_exec = $3,
                    body_exec = $4
                WHERE id_survey = $5
            `, [
                Number(id_user_tecnico),
                fecha_programada,
                JSON.stringify(headerExec),
                JSON.stringify(bodyPoblado),
                resolvedSurveyId
            ]);
        } else {
            // Crear nuevo registro tsrv_survey con template 80
            const tmplRes = await pool.query(`
                SELECT body_seed, header_seed, approval_seed, id_flow_tmpl 
                FROM sch_leangsp.tsrv_templates 
                WHERE id_template = 80
            `);

            let bodySeed = { segmentos: [] };
            let headerSeed = {};
            let approvalSeed = {};
            let idFlowTmpl = 1;

            if (tmplRes.rowCount > 0) {
                const t = tmplRes.rows[0];
                bodySeed = typeof t.body_seed === 'string' ? JSON.parse(t.body_seed) : (t.body_seed || { segmentos: [] });
                headerSeed = typeof t.header_seed === 'string' ? JSON.parse(t.header_seed) : (t.header_seed || {});
                approvalSeed = typeof t.approval_seed === 'string' ? JSON.parse(t.approval_seed) : (t.approval_seed || {});
                idFlowTmpl = Number(t.id_flow_tmpl) || 1;
            }

            const headerExec = {
                nro_visita: 1,
                tipo_visita: 'INICIAL',
                origen: 'ASIGNACION_WEB',
                contacto_obra: contactoPayload,
                observaciones: observaciones || '',
                historial_asignaciones: [
                    {
                        id_user: Number(id_user_tecnico),
                        tecnico_nombre: tecnicoNombre,
                        fecha_asignacion: new Date().toISOString(),
                        asignado_por: asignadoPor,
                        tipo_accion: "CREACION_ASIGNACION_WEB"
                    }
                ]
            };

            const bodyPoblado = preSembrarBodyTemplate80(bodySeed, pry, crm, contactoPayload, observaciones);

            const insRes = await pool.query(`
                INSERT INTO sch_leangsp.tsrv_survey (
                    id_tipo_srv, id_template, id_user, id_user_creacion, id_empresa_cliente,
                    estado_srv, header_seed, body_seed, approval_seed, header_exec, body_exec, approval_exec,
                    fecha_plan_ini, fecha_plan_fin, latitud, longitud, id_proyecto, id_flow_tmpl
                ) VALUES (
                    2, 80, $1, $2, $3,
                    'PLANIFICADO', $4, $5, $6, $7, $8, $9,
                    $10, $11, $12, $13, $14, $15
                ) RETURNING id_survey;
            `, [
                Number(id_user_tecnico),
                req.user?.id_user || 1,
                pry.id_empresa_cliente,
                JSON.stringify(headerSeed),
                JSON.stringify(bodySeed),
                JSON.stringify(approvalSeed),
                JSON.stringify(headerExec),
                JSON.stringify(bodyPoblado),
                JSON.stringify(approvalSeed),
                fecha_programada,
                fecha_programada,
                crm.coordenadas_mapa?.lat || null,
                crm.coordenadas_mapa?.lng || null,
                Number(id_proyecto),
                idFlowTmpl
            ]);

            resolvedSurveyId = insRes.rows[0].id_survey;
        }

        // 3. Actualizar snapshot en tpry_proyecto
        const idxSnapshot = jf.operaciones_v1.visitas.findIndex(v => Number(v.id_survey) === Number(resolvedSurveyId));
        const visitSnapshot = {
            id_survey: resolvedSurveyId,
            nro_visita: 1,
            tipo_visita: 'INICIAL',
            estado: 'PLANIFICADO',
            id_user: Number(id_user_tecnico),
            tecnico_nombre: tecnicoNombre,
            fecha_programada: fecha_programada,
            pdf_url: `/api/servicio/exportar/${resolvedSurveyId}`
        };

        if (idxSnapshot >= 0) {
            jf.operaciones_v1.visitas[idxSnapshot] = visitSnapshot;
        } else {
            jf.operaciones_v1.visitas.push(visitSnapshot);
        }

        crm.visita_tecnico_asignado = Number(id_user_tecnico);
        crm.fecha_visita_programada = fecha_programada;
        if (contacto_nombre) crm.contacto_nombre = contacto_nombre;
        if (contacto_telefono) crm.contacto_telefono = contacto_telefono;
        if (contacto_email) crm.contacto_email = contacto_email;

        await pool.query(`
            UPDATE sch_leangsp.tpry_proyecto
            SET estado_solicitud_visita = 'ASIGNADA',
                token_visita = NULL,
                json_field = $1
            WHERE id_proyecto = $2
        `, [JSON.stringify(jf), Number(id_proyecto)]);

        // 4. Despachar notificación por correo al técnico inspector
        if (tecnico.email) {
            try {
                const dirObra = crm.obra_direccion || 'No especificada';
                const fStr = new Date(fecha_programada).toLocaleString('es-CL');
                const pwaUrl = `https://servidor.leanglobal.cl/pwa-gsp-dev/`;

                const contenido = `
                  <div style="background: #14171f; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cliente:</span> <span style="color: #ffffff; font-weight: bold;">${pry.cliente_nombre || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Proyecto:</span> <span style="color: #ffffff; font-weight: bold;">${pry.nombre_proyecto || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cód. Cotización:</span> <span style="color: #ffffff; font-weight: bold;">${pry.codi_proyecto || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Fecha Programada:</span> <span style="color: #34d399; font-weight: bold;">${fStr}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Contacto en Obra:</span> <span style="color: #ffffff;">${contactoPayload.nombre} (${contactoPayload.telefono})</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Dirección Obra:</span> <span style="color: #ffffff;">${dirObra}</span></div>
                    ${observaciones ? `<div style="margin-bottom: 0; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Instrucciones:</span> <span style="color: #fbbf24;">${observaciones}</span></div>` : ''}
                  </div>
                  <p style="color: #94a3b8; font-size: 13px; text-align: center;">Ingresa a la aplicación móvil PWA para completar la encuesta técnica en terreno.</p>
                `;

                const cuerpoHTML = messageModel.obtenerPlantillaHTML({
                    titulo: "Nueva Visita Técnica Asignada",
                    subtitulo: `Estimado(a) ${tecnicoNombre}, se te ha asignado la inspección técnica en terreno para la siguiente obra:`,
                    contenido,
                    botonTexto: "ABRIR SURVEY EN PWA",
                    botonUrl: pwaUrl
                });

                await messageModel.enviarYRegistrarCorreo({
                    para: tecnico.email,
                    asunto: `👷 Asignación de Visita a Terreno - ${pry.codi_proyecto || pry.nombre_proyecto}`,
                    cuerpo: cuerpoHTML,
                    esHtml: true
                });
            } catch (mailErr) {
                console.warn("[asignarVisitaWeb] No se pudo despachar correo al técnico:", mailErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Visita técnica asignada exitosamente en web y notificada al inspector.",
            id_survey: resolvedSurveyId,
            id_proyecto: Number(id_proyecto),
            estado_srv: "PLANIFICADO"
        });
    } catch (err) {
        console.error("Error en asignarVisitaWeb:", err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * 3. POST /api/operaciones/visita/:id_survey/reasignar
 * Reasigna el inspector técnico por imprevistos operativos antes de la ejecución
 */
const reasignarVisita = async (req, res) => {
    try {
        const { id_survey } = req.params;
        const { id_user_nuevo, motivo, fecha_programada } = req.body;

        if (!id_survey || !id_user_nuevo) {
            return res.status(400).json({ error: "Faltan parámetros: id_survey e id_user_nuevo son obligatorios" });
        }

        // 1. Obtener la visita actual
        const srvRes = await pool.query(`
            SELECT s.id_survey, s.id_proyecto, s.id_user, s.estado_srv, s.header_exec, s.fecha_plan_ini,
                   p.nombre_proyecto, p.codi_proyecto, p.json_field, e.razon_social as cliente_nombre
            FROM sch_leangsp.tsrv_survey s
            LEFT JOIN sch_leangsp.tpry_proyecto p ON s.id_proyecto = p.id_proyecto
            LEFT JOIN sch_leangsp.tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
            WHERE s.id_survey = $1
        `, [Number(id_survey)]);

        if (srvRes.rowCount === 0) {
            return res.status(404).json({ error: "Visita no encontrada" });
        }

        const survey = srvRes.rows[0];

        // Validar que no esté ejecutada
        if (['EJECUTADO', 'FINALIZADO'].includes(survey.estado_srv)) {
            return res.status(400).json({ error: "No es posible reasignar una visita técnica que ya se encuentra ejecutada." });
        }

        // 2. Obtener datos del nuevo técnico inspector
        const userRes = await pool.query(`
            SELECT id_user, name_frst, apellido_pat, email, movil AS fono
            FROM sch_leangsp.tsec_users
            WHERE id_user = $1
        `, [Number(id_user_nuevo)]);

        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "Nuevo técnico inspector no encontrado" });
        }

        const nuevoTecnico = userRes.rows[0];
        const nuevoTecnicoNombre = `${nuevoTecnico.name_frst || ''} ${nuevoTecnico.apellido_pat || ''}`.trim();
        const reasignadoPor = req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : 'Coordinador Operaciones';

        let headerExec = survey.header_exec;
        if (typeof headerExec === 'string') {
            try { headerExec = JSON.parse(headerExec); } catch (_) { headerExec = {}; }
        }
        if (!headerExec || typeof headerExec !== 'object') headerExec = {};
        if (!Array.isArray(headerExec.historial_asignaciones)) headerExec.historial_asignaciones = [];

        headerExec.historial_asignaciones.push({
            id_user_anterior: survey.id_user,
            id_user_nuevo: Number(id_user_nuevo),
            tecnico_nuevo_nombre: nuevoTecnicoNombre,
            motivo: motivo || "Reasignación operacional por imprevistos",
            fecha_reasignacion: new Date().toISOString(),
            reasignado_por: reasignadoPor,
            fecha_programada: fecha_programada || survey.fecha_plan_ini
        });

        // Actualizar survey
        const fechaIni = fecha_programada || survey.fecha_plan_ini;
        await pool.query(`
            UPDATE sch_leangsp.tsrv_survey
            SET id_user = $1,
                fecha_plan_ini = $2,
                fecha_plan_fin = $2,
                header_exec = $3
            WHERE id_survey = $4
        `, [Number(id_user_nuevo), fechaIni, JSON.stringify(headerExec), Number(id_survey)]);

        // 3. Actualizar snapshot en tpry_proyecto si existe id_proyecto
        if (survey.id_proyecto) {
            let jf = survey.json_field;
            if (typeof jf === 'string') {
                try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
            }
            if (jf && typeof jf === 'object') {
                if (!jf.operaciones_v1) jf.operaciones_v1 = {};
                if (!Array.isArray(jf.operaciones_v1.visitas)) jf.operaciones_v1.visitas = [];

                const idx = jf.operaciones_v1.visitas.findIndex(v => Number(v.id_survey) === Number(id_survey));
                if (idx >= 0) {
                    jf.operaciones_v1.visitas[idx].id_user = Number(id_user_nuevo);
                    jf.operaciones_v1.visitas[idx].tecnico_nombre = nuevoTecnicoNombre;
                    if (fecha_programada) jf.operaciones_v1.visitas[idx].fecha_programada = fecha_programada;
                }
                if (jf.crm_v1) {
                    jf.crm_v1.visita_tecnico_asignado = Number(id_user_nuevo);
                    if (fecha_programada) jf.crm_v1.fecha_visita_programada = fecha_programada;
                }

                await pool.query(`
                    UPDATE sch_leangsp.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2
                `, [JSON.stringify(jf), Number(survey.id_proyecto)]);
            }
        }

        // 4. Notificar por correo al nuevo técnico inspector
        if (nuevoTecnico.email) {
            try {
                const fStr = fechaIni ? new Date(fechaIni).toLocaleString('es-CL') : 'A coordinar';
                const contenido = `
                  <div style="background: #14171f; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cliente:</span> <span style="color: #ffffff; font-weight: bold;">${survey.cliente_nombre || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Proyecto:</span> <span style="color: #ffffff; font-weight: bold;">${survey.nombre_proyecto || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cód. Cotización:</span> <span style="color: #ffffff; font-weight: bold;">${survey.codi_proyecto || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Fecha Programada:</span> <span style="color: #34d399; font-weight: bold;">${fStr}</span></div>
                    <div style="margin-bottom: 0; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Motivo Cambio:</span> <span style="color: #fbbf24;">${motivo || 'Reasignación operativa de faena'}</span></div>
                  </div>
                  <p style="color: #94a3b8; font-size: 13px; text-align: center;">Accede a la PWA para consultar los antecedentes de la inspección.</p>
                `;

                const cuerpoHTML = messageModel.obtenerPlantillaHTML({
                    titulo: "Reasignación de Visita a Terreno",
                    subtitulo: `Estimado(a) ${nuevoTecnicoNombre}, se te ha reasignado la siguiente inspección técnica:`,
                    contenido,
                    botonTexto: "ABRIR SURVEY EN PWA",
                    botonUrl: "https://servidor.leanglobal.cl/pwa-gsp-dev/"
                });

                await messageModel.enviarYRegistrarCorreo({
                    para: nuevoTecnico.email,
                    asunto: `🔄 Reasignación de Visita a Terreno - ${survey.codi_proyecto || survey.nombre_proyecto}`,
                    cuerpo: cuerpoHTML,
                    esHtml: true
                });
            } catch (mErr) {
                console.warn("[reasignarVisita] No se pudo enviar correo de reasignación:", mErr.message);
            }
        }

        return res.status(200).json({
            success: true,
            message: "Visita técnica reasignada con éxito al nuevo técnico inspector.",
            id_survey: Number(id_survey),
            id_user: Number(id_user_nuevo),
            tecnico_nombre: nuevoTecnicoNombre
        });
    } catch (err) {
        console.error("Error en reasignarVisita:", err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * 4. POST /api/operaciones/visita/crear-operaciones
 * Creación autónoma de visita técnica por operaciones o subsecuente en modelo 1:N
 */
const crearVisitaOperaciones = async (req, res) => {
    try {
        const {
            id_proyecto,
            tipo_visita,
            id_user_tecnico,
            fecha_programada,
            justificacion
        } = req.body;

        if (!id_proyecto || !id_user_tecnico || !fecha_programada) {
            return res.status(400).json({ error: "Faltan parámetros: id_proyecto, id_user_tecnico y fecha_programada son obligatorios" });
        }

        // 1. Obtener proyecto y cliente
        const pryRes = await pool.query(`
            SELECT p.id_proyecto, p.nombre_proyecto, p.codi_proyecto, p.json_field, p.id_empresa_cliente,
                   e.razon_social as cliente_nombre, e.rut_empresa as cliente_rut
            FROM sch_leangsp.tpry_proyecto p
            LEFT JOIN sch_leangsp.tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
            WHERE p.id_proyecto = $1
        `, [Number(id_proyecto)]);

        if (pryRes.rowCount === 0) {
            return res.status(404).json({ error: "Proyecto no encontrado" });
        }

        const pry = pryRes.rows[0];
        let jf = pry.json_field;
        if (typeof jf === 'string') {
            try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
        }
        if (!jf || typeof jf !== 'object') jf = {};
        if (!jf.crm_v1) jf.crm_v1 = {};
        if (!jf.operaciones_v1) jf.operaciones_v1 = {};
        if (!Array.isArray(jf.operaciones_v1.visitas)) jf.operaciones_v1.visitas = [];

        const crm = jf.crm_v1;

        // 2. Determinar número de visita consecutivo (1:N)
        const countRes = await pool.query(`
            SELECT COUNT(*) as total FROM sch_leangsp.tsrv_survey 
            WHERE id_proyecto = $1 AND id_template = 80
        `, [Number(id_proyecto)]);

        const nro_visita = Number(countRes.rows[0].total) + 1;

        // 3. Obtener técnico inspector
        const userRes = await pool.query(`
            SELECT id_user, name_frst, apellido_pat, email, movil AS fono
            FROM sch_leangsp.tsec_users
            WHERE id_user = $1
        `, [Number(id_user_tecnico)]);

        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "Técnico inspector no encontrado" });
        }

        const tecnico = userRes.rows[0];
        const tecnicoNombre = `${tecnico.name_frst || ''} ${tecnico.apellido_pat || ''}`.trim();
        const asignadoPor = req.user?.name_frst ? `${req.user.name_frst} ${req.user.apellido_pat || ''}`.trim() : 'Coordinador Operaciones Web';

        // 4. Obtener Template 80
        const tmplRes = await pool.query(`
            SELECT body_seed, header_seed, approval_seed, id_flow_tmpl 
            FROM sch_leangsp.tsrv_templates 
            WHERE id_template = 80
        `);

        let bodySeed = { segmentos: [] };
        let headerSeed = {};
        let approvalSeed = {};
        let idFlowTmpl = 1;

        if (tmplRes.rowCount > 0) {
            const t = tmplRes.rows[0];
            bodySeed = typeof t.body_seed === 'string' ? JSON.parse(t.body_seed) : (t.body_seed || { segmentos: [] });
            headerSeed = typeof t.header_seed === 'string' ? JSON.parse(t.header_seed) : (t.header_seed || {});
            approvalSeed = typeof t.approval_seed === 'string' ? JSON.parse(t.approval_seed) : (t.approval_seed || {});
            idFlowTmpl = Number(t.id_flow_tmpl) || 1;
        }

        const tipoVisitaFinal = tipo_visita || (nro_visita === 1 ? 'INICIAL' : 'REPLANTEO_MANIOBRA');

        const contactoPayload = {
            nombre: crm.contacto_nombre || '',
            telefono: crm.contacto_telefono || '',
            email: crm.contacto_email || ''
        };

        const headerExec = {
            nro_visita,
            tipo_visita: tipoVisitaFinal,
            origen: 'CREACION_AUTONOMA_OPERACIONES',
            justificacion: justificacion || '',
            contacto_obra: contactoPayload,
            observaciones: justificacion || '',
            historial_asignaciones: [
                {
                    id_user: Number(id_user_tecnico),
                    tecnico_nombre: tecnicoNombre,
                    fecha_asignacion: new Date().toISOString(),
                    asignado_por: asignadoPor,
                    tipo_accion: "CREACION_AUTONOMA_OPERACIONES"
                }
            ]
        };

        const bodyPoblado = preSembrarBodyTemplate80(bodySeed, pry, crm, contactoPayload, justificacion);

        // 5. Insertar nueva visita 1:N
        const insRes = await pool.query(`
            INSERT INTO sch_leangsp.tsrv_survey (
                id_tipo_srv, id_template, id_user, id_user_creacion, id_empresa_cliente,
                estado_srv, header_seed, body_seed, approval_seed, header_exec, body_exec, approval_exec,
                fecha_plan_ini, fecha_plan_fin, latitud, longitud, id_proyecto, id_flow_tmpl
            ) VALUES (
                2, 80, $1, $2, $3,
                'PLANIFICADO', $4, $5, $6, $7, $8, $9,
                $10, $11, $12, $13, $14, $15
            ) RETURNING id_survey;
        `, [
            Number(id_user_tecnico),
            req.user?.id_user || 1,
            pry.id_empresa_cliente,
            JSON.stringify(headerSeed),
            JSON.stringify(bodySeed),
            JSON.stringify(approvalSeed),
            JSON.stringify(headerExec),
            JSON.stringify(bodyPoblado),
            JSON.stringify(approvalSeed),
            fecha_programada,
            fecha_programada,
            crm.coordenadas_mapa?.lat || null,
            crm.coordenadas_mapa?.lng || null,
            Number(id_proyecto),
            idFlowTmpl
        ]);

        const newSurveyId = insRes.rows[0].id_survey;

        // 6. Actualizar snapshot y bitácora en tpry_proyecto
        jf.operaciones_v1.visitas.push({
            id_survey: newSurveyId,
            nro_visita,
            tipo_visita: tipoVisitaFinal,
            estado: 'PLANIFICADO',
            id_user: Number(id_user_tecnico),
            tecnico_nombre: tecnicoNombre,
            fecha_programada: fecha_programada,
            pdf_url: `/api/servicio/exportar/${newSurveyId}`
        });

        if (!Array.isArray(jf.bitacora)) jf.bitacora = [];
        jf.bitacora.push({
            fecha: new Date().toISOString(),
            accion: `Creación de Visita #${nro_visita} (${tipoVisitaFinal}) por Operaciones`,
            usuario: asignadoPor,
            justificacion: justificacion || "Requerimiento de verificación operacional"
        });

        await pool.query(`
            UPDATE sch_leangsp.tpry_proyecto
            SET estado_solicitud_visita = 'ASIGNADA',
                json_field = $1
            WHERE id_proyecto = $2
        `, [JSON.stringify(jf), Number(id_proyecto)]);

        // 7. Notificar por correo al técnico inspector
        if (tecnico.email) {
            try {
                const dirObra = crm.obra_direccion || 'No especificada';
                const fStr = new Date(fecha_programada).toLocaleString('es-CL');
                const contenido = `
                  <div style="background: #14171f; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cliente:</span> <span style="color: #ffffff; font-weight: bold;">${pry.cliente_nombre || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Proyecto:</span> <span style="color: #ffffff; font-weight: bold;">${pry.nombre_proyecto || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cód. Cotización:</span> <span style="color: #ffffff; font-weight: bold;">${pry.codi_proyecto || 'N/A'}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Tipo de Visita:</span> <span style="color: #38bdf8; font-weight: bold;">Visita #${nro_visita} (${tipoVisitaFinal})</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Fecha Programada:</span> <span style="color: #34d399; font-weight: bold;">${fStr}</span></div>
                    <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Dirección Obra:</span> <span style="color: #ffffff;">${dirObra}</span></div>
                    ${justificacion ? `<div style="margin-bottom: 0; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Justificación:</span> <span style="color: #fbbf24;">${justificacion}</span></div>` : ''}
                  </div>
                  <p style="color: #94a3b8; font-size: 13px; text-align: center;">Ingresa a la aplicación móvil PWA para gestionar el formulario de inspección.</p>
                `;

                const cuerpoHTML = messageModel.obtenerPlantillaHTML({
                    titulo: `Nueva Visita Técnica Programada (#${nro_visita})`,
                    subtitulo: `Estimado(a) ${tecnicoNombre}, Operaciones ha agendado una nueva inspección técnica para faena:`,
                    contenido,
                    botonTexto: "ABRIR SURVEY EN PWA",
                    botonUrl: "https://servidor.leanglobal.cl/pwa-gsp-dev/"
                });

                await messageModel.enviarYRegistrarCorreo({
                    para: tecnico.email,
                    asunto: `👷 Nueva Visita Técnica #${nro_visita} - ${pry.codi_proyecto || pry.nombre_proyecto}`,
                    cuerpo: cuerpoHTML,
                    esHtml: true
                });
            } catch (mailErr) {
                console.warn("[crearVisitaOperaciones] No se pudo enviar correo:", mailErr.message);
            }
        }

        return res.status(201).json({
            success: true,
            message: `Visita #${nro_visita} (${tipoVisitaFinal}) creada exitosamente por Operaciones.`,
            id_survey: newSurveyId,
            nro_visita,
            tipo_visita: tipoVisitaFinal,
            estado_srv: "PLANIFICADO"
        });
    } catch (err) {
        console.error("Error en crearVisitaOperaciones:", err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * 5. Flujos originales por Token y Correo (Conserva 100% de compatibilidad)
 */
const solicitarVisita = async (req, res) => {
    try {
        const { id_proyecto } = req.params;
        const { 
            email_coordinador, 
            id_coordinador, 
            contacto_nombre, 
            contacto_telefono, 
            contacto_email,
            obra_nombre,
            obra_direccion,
            obra_ciudad,
            coordenadas_mapa,
            detalle_servicio
        } = req.body;

        if (!id_proyecto) {
            return res.status(400).json({ error: "Falta id_proyecto" });
        }

        const token = crypto.randomUUID();

        const pryRes = await pool.query(`
            SELECT p.id_proyecto, p.nombre_proyecto, p.codi_proyecto, p.json_field, e.razon_social as cliente_nombre
            FROM sch_leangsp.tpry_proyecto p
            LEFT JOIN sch_leangsp.tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
            WHERE p.id_proyecto = $1
        `, [id_proyecto]);

        if (pryRes.rowCount === 0) {
            return res.status(404).json({ error: "Proyecto no encontrado" });
        }

        const proyecto = pryRes.rows[0];
        let jsonField = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field) : (proyecto.json_field || {});

        if (!jsonField.crm_v1) jsonField.crm_v1 = {};

        // Resolver id_coordinador si no viene directamente
        let resolvedCoordinadorId = id_coordinador ? Number(id_coordinador) : null;
        if (!resolvedCoordinadorId && email_coordinador) {
            const uRes = await pool.query(
                `SELECT id_user FROM sch_leangsp.tsec_users 
                 WHERE LOWER(email) = LOWER($1) 
                 LIMIT 1`,
                [email_coordinador.trim()]
            );
            if (uRes.rowCount > 0) {
                resolvedCoordinadorId = uRes.rows[0].id_user;
            }
        }

        if (resolvedCoordinadorId) jsonField.crm_v1.coordinador_visita = resolvedCoordinadorId;
        if (contacto_nombre !== undefined) jsonField.crm_v1.contacto_nombre = contacto_nombre;
        if (contacto_telefono !== undefined) jsonField.crm_v1.contacto_telefono = contacto_telefono;
        if (contacto_email !== undefined) jsonField.crm_v1.contacto_email = contacto_email;
        if (obra_nombre) jsonField.crm_v1.obra_nombre = obra_nombre;
        if (obra_direccion) jsonField.crm_v1.obra_direccion = obra_direccion;
        if (obra_ciudad) jsonField.crm_v1.obra_ciudad = obra_ciudad;
        if (coordenadas_mapa) jsonField.crm_v1.coordenadas_mapa = coordenadas_mapa;
        if (detalle_servicio) jsonField.crm_v1.detalle_servicio = detalle_servicio;

        await pool.query(`
            UPDATE sch_leangsp.tpry_proyecto
            SET token_visita = $1,
                estado_solicitud_visita = 'PENDIENTE_ASIGNACION',
                json_field = $2
            WHERE id_proyecto = $3
        `, [token, JSON.stringify(jsonField), id_proyecto]);

        // Enviar correo B2B HTML al coordinador
        if (email_coordinador) {
            const crm = jsonField.crm_v1 || {};
            const lat = coordenadas_mapa?.lat || crm.coordenadas_mapa?.lat;
            const lng = coordenadas_mapa?.lng || crm.coordenadas_mapa?.lng;
            const mapUrl = (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : null;
            const ubicacionHtml = mapUrl 
                ? `<a href="${mapUrl}" style="color: #38bdf8; font-weight: bold; text-decoration: underline;" target="_blank">Ver en Google Maps</a>`
                : `<span style="color: #ffffff;">${obra_direccion || crm.obra_direccion || 'No especificada'}</span>`;

            const titulo = "Solicitud de Visita a Terreno";
            const subtitulo = "Se ha solicitado asignar una visita a terreno para la siguiente cotización:";
            const botonUrl = `https://servidor.leanglobal.cl/lg-gsp-dev/asignar-visita/${token}`;
            const descripcionServicio = detalle_servicio || crm.detalle_servicio || crm.descripcion || proyecto.nombre_proyecto || 'Sin descripción';
            const contactoNombreVal = contacto_nombre || crm.contacto_nombre || 'No especificado';
            const contactoTelefonoVal = (contacto_telefono || crm.contacto_telefono || '').trim();
            const contactoEmailVal = contacto_email || crm.contacto_email || 'No especificado';

            const contactoDisplay = (contactoTelefonoVal && contactoTelefonoVal !== 'No especificado')
                ? `${contactoNombreVal} (${contactoTelefonoVal})`
                : contactoNombreVal;

            const contenido = `
              <div style="background: #14171f; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cliente:</span> <span style="color: #ffffff; font-weight: bold;">${proyecto.cliente_nombre || 'N/A'}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Proyecto:</span> <span style="color: #ffffff; font-weight: bold;">${proyecto.nombre_proyecto || 'N/A'}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cód. Cotización:</span> <span style="color: #ffffff; font-weight: bold;">${proyecto.codi_proyecto || 'N/A'}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Contacto Terreno:</span> <span style="color: #ffffff; font-weight: bold;">${contactoDisplay}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Correo Contacto:</span> <span style="color: #ffffff;">${contactoEmailVal}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Descripción:</span> <span style="color: #ffffff;">${descripcionServicio}</span></div>
                <div style="margin-bottom: 0; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Ubicación:</span> ${ubicacionHtml}</div>
              </div>
              <p style="color: #94a3b8; font-size: 13px; text-align: center; margin-top: 15px;">Haga clic en el botón inferior para asignar al especialista y definir la fecha.</p>
            `;

            const cuerpoHTML = messageModel.obtenerPlantillaHTML({
                titulo,
                subtitulo,
                contenido,
                botonTexto: "ASIGNAR VISITA",
                botonUrl
            });

            await messageModel.enviarYRegistrarCorreo({
                para: email_coordinador,
                asunto: `📌 Solicitud de Visita a Terreno - ${proyecto.codi_proyecto || proyecto.nombre_proyecto}`,
                cuerpo: cuerpoHTML,
                esHtml: true
            });
        }

        return res.status(200).json({
            message: "Solicitud registrada con éxito. Notificación enviada al coordinador.",
            token_visita: token
        });
    } catch (err) {
        console.error("Error en solicitarVisita:", err);
        return res.status(500).json({ error: err.message });
    }
};

const getDatosVisita = async (req, res) => {
    try {
        const { token } = req.params;

        const pryRes = await pool.query(`
            SELECT p.id_proyecto, p.nombre_proyecto, p.codi_proyecto, p.json_field, p.id_empresa_cliente, e.razon_social as cliente_nombre, e.rut_empresa as cliente_rut
            FROM sch_leangsp.tpry_proyecto p
            LEFT JOIN sch_leangsp.tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
            WHERE p.token_visita = $1
        `, [token]);

        if (pryRes.rowCount === 0) {
            return res.status(404).json({ error: "El enlace de asignación no es válido o ya fue utilizado." });
        }

        const pry = pryRes.rows[0];
        const jsonField = typeof pry.json_field === 'string' ? JSON.parse(pry.json_field) : (pry.json_field || {});
        const crm = jsonField.crm_v1 || {};

        let coordinadorData = null;
        if (crm.coordinador_visita) {
            const coordRes = await pool.query(`
                SELECT id_user, email, CONCAT(name_frst, ' ', apellido_pat) as nombre
                FROM sch_leangsp.tsec_users
                WHERE id_user = $1
            `, [crm.coordinador_visita]);

            if (coordRes.rowCount > 0) {
                coordinadorData = coordRes.rows[0];
            }
        }

        return res.status(200).json({
            proyecto: {
                id_proyecto: pry.id_proyecto,
                nombre_proyecto: pry.nombre_proyecto,
                codi_proyecto: pry.codi_proyecto,
                descripcion: crm.detalle_servicio || pry.descripcion || crm.descripcion || '',
                id_empresa_cliente: pry.id_empresa_cliente,
                cliente_nombre: pry.cliente_nombre || crm.cliente_nombre,
                cliente_rut: pry.cliente_rut,
                obra_nombre: crm.obra_nombre || pry.nombre_proyecto,
                obra_direccion: crm.obra_direccion || '',
                coordenadas_mapa: crm.coordenadas_mapa || null,
                contacto_nombre: crm.contacto_nombre || null,
                contacto_telefono: crm.contacto_telefono || null,
                contacto_email: crm.contacto_email || null,
                coordinador: coordinadorData
            }
        });
    } catch (err) {
        console.error("Error en getDatosVisita:", err);
        return res.status(500).json({ error: err.message });
    }
};

const asignarVisita = async (req, res) => {
    try {
        const { token } = req.params;
        const { id_ejecutor, fecha_visita, id_coordinador, fes_pin_hash, comentarios_coordinador } = req.body;

        // 1. Obtener proyecto y resolver coordinador si no viene en el body
        const tokenPryRes = await pool.query(`
            SELECT id_proyecto, nombre_proyecto, id_empresa_cliente, json_field 
            FROM sch_leangsp.tpry_proyecto 
            WHERE token_visita = $1
        `, [token]);

        if (tokenPryRes.rowCount === 0) {
            return res.status(404).json({ error: "Token inválido o expirado" });
        }

        const pryRow = tokenPryRes.rows[0];
        const jField = typeof pryRow.json_field === 'string' ? JSON.parse(pryRow.json_field) : (pryRow.json_field || {});
        const crm = jField.crm_v1 || {};

        let resolvedCoordId = id_coordinador ? Number(id_coordinador) : (crm.coordinador_visita ? Number(crm.coordinador_visita) : null);

        // Fallback robusto: Si no viene en el body ni en json_field, resolver por el PIN hash FES del usuario
        if (!resolvedCoordId && fes_pin_hash) {
            const uPinRes = await pool.query(
                `SELECT id_user FROM sch_leangsp.tsec_users WHERE pass_hash_fes = $1 LIMIT 1`,
                [fes_pin_hash.trim()]
            );
            if (uPinRes.rowCount > 0) {
                resolvedCoordId = uPinRes.rows[0].id_user;
                if (!crm.coordinador_visita) {
                    crm.coordinador_visita = resolvedCoordId;
                }
            }
        }

        if (!id_ejecutor || !fecha_visita || !resolvedCoordId || !fes_pin_hash) {
            return res.status(400).json({ error: "Faltan datos requeridos (incluyendo Firma FES)" });
        }

        // 2. Validar FES PIN del coordinador
        const userRes = await pool.query(`SELECT pass_hash_fes FROM sch_leangsp.tsec_users WHERE id_user = $1`, [resolvedCoordId]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "Usuario coordinador no encontrado." });
        }

        const realHash = userRes.rows[0].pass_hash_fes;
        if (!realHash || realHash.toLowerCase() !== fes_pin_hash.toLowerCase()) {
            return res.status(401).json({ error: "Firma Electrónica Simple inválida. PIN incorrecto." });
        }

        // 3. Marcar token asignado y actualizar tpry_proyecto
        if (comentarios_coordinador) {
            crm.comentarios_visita_coordinador = comentarios_coordinador;
        }
        await pool.query(`
            UPDATE sch_leangsp.tpry_proyecto
            SET estado_solicitud_visita = 'ASIGNADA',
                token_visita = NULL,
                json_field = $1
            WHERE id_proyecto = $2
        `, [JSON.stringify(jField), pryRow.id_proyecto]);

        return res.status(200).json({ message: "Visita asignada y firmada con éxito", id_proyecto: pryRow.id_proyecto });
    } catch (err) {
        console.error("Error en asignarVisita:", err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    solicitarVisita,
    getDatosVisita,
    asignarVisita,
    getVisitasProyecto,
    asignarVisitaWeb,
    reasignarVisita,
    crearVisitaOperaciones
};
