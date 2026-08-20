const pool = require('../config/postgresPool');
const crypto = require('crypto');
const MessageModel = require('../models/messageModel');
const messageModel = new MessageModel();

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

        // Resolver id_coordinador si no viene directamente
        let resolvedCoordinadorId = id_coordinador ? Number(id_coordinador) : null;
        if (!resolvedCoordinadorId && email_coordinador) {
            const uRes = await pool.query(
                `SELECT id_user FROM tsec_users 
                 WHERE LOWER(email) = LOWER($1) OR LOWER(correo) = LOWER($1) OR LOWER(username) = LOWER($1) 
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
            UPDATE tpry_proyecto
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
            FROM tpry_proyecto 
            WHERE token_visita = $1
        `, [token]);

        if (tokenPryRes.rowCount === 0) {
            return res.status(404).json({ error: "Token inválido o expirado" });
        }

        const pryRow = tokenPryRes.rows[0];
        const jField = typeof pryRow.json_field === 'string' ? JSON.parse(pryRow.json_field) : (pryRow.json_field || {});
        const crm = jField.crm_v1 || {};

        let resolvedCoordId = id_coordinador ? Number(id_coordinador) : (crm.coordinador_visita ? Number(crm.coordinador_visita) : null);

        if (!id_ejecutor || !fecha_visita || !resolvedCoordId || !fes_pin_hash) {
            return res.status(400).json({ error: "Faltan datos requeridos (incluyendo Firma FES)" });
        }

        // 2. Validar FES PIN del coordinador
        const userRes = await pool.query(`SELECT pass_hash_fes FROM tsec_users WHERE id_user = $1`, [resolvedCoordId]);
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
            UPDATE tpry_proyecto
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
    asignarVisita
};
