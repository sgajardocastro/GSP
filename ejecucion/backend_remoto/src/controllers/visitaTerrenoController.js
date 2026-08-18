const pool = require('../config/postgresPool');
const crypto = require('crypto');
const MessageModel = require('../models/messageModel');
const messageModel = new MessageModel();

const solicitarVisita = async (req, res) => {
    try {
        const { id_proyecto } = req.params;
        const { email_coordinador, id_coordinador, contacto_nombre, contacto_telefono, contacto_email } = req.body;

        if (!id_proyecto) {
            return res.status(400).json({ error: "Falta id_proyecto" });
        }

        const token = crypto.randomUUID();

        const pryRes = await pool.query(`
            SELECT p.id_proyecto, p.nombre_proyecto, p.codi_proyecto, p.json_field, e.razon_social as cliente_nombre
            FROM tpry_proyecto p
            LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
            WHERE p.id_proyecto = $1
        `, [id_proyecto]);

        if (pryRes.rowCount === 0) {
            return res.status(404).json({ error: "Proyecto no encontrado" });
        }

        const proyecto = pryRes.rows[0];
        let jsonField = typeof proyecto.json_field === 'string' ? JSON.parse(proyecto.json_field) : (proyecto.json_field || {});

        if (!jsonField.crm_v1) jsonField.crm_v1 = {};
        if (id_coordinador) jsonField.crm_v1.coordinador_visita = id_coordinador;
        if (contacto_nombre) jsonField.crm_v1.contacto_nombre = contacto_nombre;
        if (contacto_telefono) jsonField.crm_v1.contacto_telefono = contacto_telefono;
        if (contacto_email) jsonField.crm_v1.contacto_email = contacto_email;

        await pool.query(`
            UPDATE tpry_proyecto
            SET token_visita = $1,
                estado_solicitud_visita = 'PENDIENTE_ASIGNACION',
                json_field = $2
            WHERE id_proyecto = $3
        `, [token, JSON.stringify(jsonField), id_proyecto]);

        // Enviar correo B2B HTML al coordinador (Restaurado 100% a la maqueta de la Imagen 1)
        if (email_coordinador) {
            const crm = jsonField.crm_v1 || {};
            const lat = crm.coordenadas_mapa?.lat;
            const lng = crm.coordenadas_mapa?.lng;
            const mapUrl = (lat && lng) ? `https://www.google.com/maps?q=${lat},${lng}` : null;
            const ubicacionHtml = mapUrl 
                ? `<a href="${mapUrl}" style="color: #38bdf8; font-weight: bold; text-decoration: underline;" target="_blank">Ver en Google Maps</a>`
                : `<span style="color: #ffffff;">${crm.obra_direccion || 'No especificada'}</span>`;

            const titulo = "Solicitud de Visita a Terreno";
            const subtitulo = "Se ha solicitado asignar una visita a terreno para la siguiente cotización:";
            const botonUrl = `https://servidor.leanglobal.cl/lg-gsp-dev/asignar-visita/${token}`;
            const descripcionServicio = crm.detalle_servicio || crm.descripcion || 'Sin descripción';
            const contactoNombreVal = crm.contacto_nombre || 'No especificado';
            const contactoTelefonoVal = crm.contacto_telefono || 'No especificado';
            const contactoEmailVal = crm.contacto_email || 'No especificado';

            const contenido = `
              <div style="background: #14171f; border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 14px; padding: 20px; margin-bottom: 20px;">
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cliente:</span> <span style="color: #ffffff; font-weight: bold;">${proyecto.cliente_nombre || 'N/A'}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Proyecto:</span> <span style="color: #ffffff; font-weight: bold;">${proyecto.nombre_proyecto || 'N/A'}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Cód. Cotización:</span> <span style="color: #ffffff; font-weight: bold;">${proyecto.codi_proyecto || 'N/A'}</span></div>
                <div style="margin-bottom: 12px; font-size: 14px;"><span style="font-weight: 700; color: #38bdf8; display: inline-block; width: 140px;">Contacto Terreno:</span> <span style="color: #ffffff; font-weight: bold;">${contactoNombreVal} (${contactoTelefonoVal})</span></div>
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
            FROM tpry_proyecto p
            LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
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
                FROM tsec_users
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
                descripcion: pry.descripcion,
                id_empresa_cliente: pry.id_empresa_cliente,
                cliente_nombre: pry.cliente_nombre || crm.cliente_nombre,
                cliente_rut: pry.cliente_rut,
                obra_nombre: crm.obra_nombre,
                obra_direccion: crm.obra_direccion,
                coordenadas_mapa: crm.coordenadas_mapa,
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
        const { id_ejecutor, fecha_visita, id_coordinador, fes_pin_hash } = req.body;

        if (!id_ejecutor || !fecha_visita || !id_coordinador || !fes_pin_hash) {
            return res.status(400).json({ error: "Faltan datos requeridos (incluyendo Firma FES)" });
        }

        // 1. Validar FES PIN
        const userRes = await pool.query(`SELECT pass_hash_fes FROM tsec_users WHERE id_user = $1`, [id_coordinador]);
        if (userRes.rowCount === 0) {
            return res.status(404).json({ error: "Usuario coordinador no encontrado." });
        }

        const realHash = userRes.rows[0].pass_hash_fes;
        if (!realHash || realHash.toLowerCase() !== fes_pin_hash.toLowerCase()) {
            return res.status(401).json({ error: "Firma Electrónica Simple inválida. PIN incorrecto." });
        }

        // 2. Marcar token asignado y actualizar tpry_proyecto
        const result = await pool.query(`
            UPDATE tpry_proyecto
            SET estado_solicitud_visita = 'ASIGNADA',
                token_visita = NULL
            WHERE token_visita = $1
            RETURNING id_proyecto
        `, [token]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Token inválido o expirado" });
        }

        const id_proyecto = result.rows[0].id_proyecto;

        // 3. Obtener datos del proyecto y template 80 para instanciar/actualizar la encuesta con datos comerciales
        try {
            const pryRowRes = await pool.query('SELECT id_proyecto, nombre_proyecto, id_empresa_cliente, json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
            if (pryRowRes.rowCount > 0) {
                const pryRow = pryRowRes.rows[0];
                const jField = typeof pryRow.json_field === 'string' ? JSON.parse(pryRow.json_field) : (pryRow.json_field || {});
                const crm = jField.crm_v1 || {};

                // Obtener body_seed de template 80
                const tmplRes = await pool.query('SELECT body_seed FROM tsrv_templates WHERE id_template = 80');
                if (tmplRes.rowCount > 0) {
                    let seed = tmplRes.rows[0].body_seed;
                    if (typeof seed === 'string') seed = JSON.parse(seed);

                    // Mapear datos comerciales al body_exec
                    (seed.segmentos || []).forEach(seg => {
                        if (seg.label && seg.label.includes('DATOS GENERALES')) {
                            (seg.attributes || []).forEach(attr => {
                                if (attr.label === 'NOMBRE DE LA OBRA') attr.default = crm.obra_nombre || pryRow.nombre_proyecto || '';
                                if (attr.label === 'DIRECCION DE LA OBRA') attr.default = crm.obra_direccion || '';
                                if (attr.label === 'REFERENCIA DE LA DIRECCION') attr.default = crm.obra_ciudad || '';
                                if (attr.label === 'GEOLOCALIZACION OBRA') attr.default = crm.coordenadas_mapa || { lat: null, lng: null };
                                if (attr.label === 'CONTACTO EN TERRENO') attr.default = crm.contacto_nombre || '';
                                if (attr.label === 'N° TELEFONO (CONTACTO EN TERRENO)') attr.default = crm.contacto_telefono || '';
                                if (attr.label === 'CORREO ELECTRONICO CONTACTO EN TERRENO') attr.default = crm.contacto_email || '';
                            });
                        }
                    });

                    // Verificar si ya existe survey para este proyecto y template 80
                    const existSurvey = await pool.query('SELECT id_survey FROM tsrv_survey WHERE id_proyecto = $1 AND id_template = 80', [id_proyecto]);
                    if (existSurvey.rowCount > 0) {
                        await pool.query(`
                            UPDATE tsrv_survey
                            SET id_user = $1,
                                fecha_plan_ini = $2,
                                body_exec = $3,
                                latitud = $4,
                                longitud = $5
                            WHERE id_survey = $6
                        `, [id_ejecutor, fecha_visita, JSON.stringify(seed), crm.coordenadas_mapa?.lat || null, crm.coordenadas_mapa?.lng || null, existSurvey.rows[0].id_survey]);
                    } else {
                        await pool.query(`
                            INSERT INTO tsrv_survey (
                                id_tipo_srv, id_template, id_user, id_user_creacion, id_empresa_cliente,
                                estado_srv, body_seed, body_exec, fecha_plan_ini, latitud, longitud, id_proyecto
                            ) VALUES (
                                1, 80, $1, $2, $3,
                                'Creado', $4, $5, $6, $7, $8, $9
                            )
                        `, [
                            id_ejecutor, id_coordinador, pryRow.id_empresa_cliente,
                            JSON.stringify(tmplRes.rows[0].body_seed), JSON.stringify(seed),
                            fecha_visita, crm.coordenadas_mapa?.lat || null, crm.coordenadas_mapa?.lng || null, id_proyecto
                        ]);
                    }
                }
            }
        } catch (surveySyncErr) {
            console.error("Error al sincronizar encuesta de visita a terreno:", surveySyncErr);
        }

        return res.status(200).json({ message: "Visita asignada y firmada con éxito", id_proyecto: id_proyecto });
    } catch (err) {
        console.error("Error en asignarVisita:", err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    solicitarVisita,
    getDatosVisita,
    asignarVisita
};
