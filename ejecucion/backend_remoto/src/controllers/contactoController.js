const pool = require('../config/postgresPool');

// Asegurar existencia de la tabla sch_leangsp.tpar_contactos
async function asegurarTablaContactos(client) {
    const db = client || pool;
    await db.query(`
        CREATE TABLE IF NOT EXISTS sch_leangsp.tpar_contactos (
            id_contacto SERIAL PRIMARY KEY,
            id_empresa INT,
            nombre VARCHAR(255) NOT NULL,
            fono VARCHAR(100),
            email VARCHAR(255),
            cargo VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

// Sincronizar contacto en el json_field.puntos_contacto de tpar_empresas
async function sincronizarPuntosContactoEmpresa(idEmpresa, contact, client) {
    const db = client || pool;
    try {
        const empRes = await db.query(
            `SELECT json_field FROM sch_leangsp.tpar_empresas WHERE id_empresa = $1`,
            [Number(idEmpresa)]
        );
        if (empRes.rowCount > 0) {
            let empJson = empRes.rows[0].json_field;
            if (typeof empJson === 'string') {
                try { empJson = JSON.parse(empJson); } catch (_) { empJson = {}; }
            }
            if (!empJson || typeof empJson !== 'object') empJson = {};
            if (!Array.isArray(empJson.puntos_contacto)) empJson.puntos_contacto = [];

            const idx = empJson.puntos_contacto.findIndex(p =>
                (p.id_contacto && Number(p.id_contacto) === Number(contact.id_contacto)) ||
                (p.nombre && p.nombre.trim().toLowerCase() === contact.nombre.trim().toLowerCase())
            );

            const puntoItem = {
                id_contacto: contact.id_contacto,
                nombre: contact.nombre,
                telefono: contact.fono || '',
                correo: contact.email || '',
                cargo: contact.cargo || 'Contacto Comercial'
            };

            if (idx >= 0) {
                empJson.puntos_contacto[idx] = { ...empJson.puntos_contacto[idx], ...puntoItem };
            } else {
                empJson.puntos_contacto.push(puntoItem);
            }

            await db.query(
                `UPDATE sch_leangsp.tpar_empresas SET json_field = $1 WHERE id_empresa = $2`,
                [JSON.stringify(empJson), Number(idEmpresa)]
            );
        }
    } catch (err) {
        console.warn("[sincronizarPuntosContactoEmpresa] Advertencia al sincronizar:", err.message);
    }
}

/**
 * POST /api/proyectos/contacto/auto-guardar
 * Body: { id_empresa_cliente, id_proyecto, nombre, fono, telefono, email, correo, cargo }
 */
const autoGuardarContacto = async (req, res) => {
    try {
        const id_empresa = req.body.id_empresa_cliente || req.body.id_empresa || req.params?.id_empresa;
        const nombre = (req.body.nombre || req.body.contacto_nombre || '').trim();
        const fono = (req.body.fono || req.body.telefono || req.body.contacto_telefono || '').trim() || null;
        const email = (req.body.email || req.body.correo || req.body.contacto_email || '').trim() || null;
        const cargo = req.body.cargo || 'Contacto Comercial';
        const id_proyecto = req.body.id_proyecto || null;

        if (!id_empresa) {
            return res.status(400).json({ error: "Falta id_empresa_cliente para registrar el contacto" });
        }
        if (!nombre) {
            return res.status(400).json({ error: "Falta el nombre del contacto" });
        }

        await asegurarTablaContactos();

        // 1. Verificar si ya existe para esa empresa
        const checkRes = await pool.query(`
            SELECT id_contacto, id_empresa, nombre, fono, email, cargo 
            FROM sch_leangsp.tpar_contactos 
            WHERE id_empresa = $1 AND LOWER(TRIM(nombre)) = LOWER(TRIM($2))
            LIMIT 1
        `, [Number(id_empresa), nombre]);

        let contact = null;

        if (checkRes.rowCount > 0) {
            contact = checkRes.rows[0];
            // Si llegan datos nuevos de fono o email y en BD estaban vacíos, actualizarlos
            const nuevoFono = fono || contact.fono;
            const nuevoEmail = email || contact.email;
            const nuevoCargo = cargo !== 'Contacto Comercial' ? cargo : contact.cargo;

            if (nuevoFono !== contact.fono || nuevoEmail !== contact.email || nuevoCargo !== contact.cargo) {
                const upRes = await pool.query(`
                    UPDATE sch_leangsp.tpar_contactos 
                    SET fono = $1, email = $2, cargo = $3, updated_at = NOW()
                    WHERE id_contacto = $4
                    RETURNING *;
                `, [nuevoFono, nuevoEmail, nuevoCargo, contact.id_contacto]);
                contact = upRes.rows[0];
            }
        } else {
            // Insertar nuevo contacto
            const insRes = await pool.query(`
                INSERT INTO sch_leangsp.tpar_contactos (id_empresa, nombre, fono, email, cargo)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `, [Number(id_empresa), nombre, fono, email, cargo]);
            contact = insRes.rows[0];
        }

        // 2. Si viene id_proyecto, vincular ID en tpry_proyecto.json_field.crm_v1
        if (id_proyecto) {
            const pryRes = await pool.query(
                `SELECT id_proyecto, json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1`,
                [Number(id_proyecto)]
            );
            if (pryRes.rowCount > 0) {
                let jf = pryRes.rows[0].json_field;
                if (typeof jf === 'string') {
                    try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
                }
                if (!jf || typeof jf !== 'object') jf = {};
                if (!jf.crm_v1) jf.crm_v1 = {};

                jf.crm_v1.id_contacto = contact.id_contacto;
                jf.crm_v1.contacto_nombre = contact.nombre;
                if (contact.fono) jf.crm_v1.contacto_telefono = contact.fono;
                if (contact.email) jf.crm_v1.contacto_email = contact.email;

                await pool.query(
                    `UPDATE sch_leangsp.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`,
                    [JSON.stringify(jf), Number(id_proyecto)]
                );
            }
        }

        // 3. Sincronizar en tpar_empresas
        await sincronizarPuntosContactoEmpresa(id_empresa, contact);

        return res.status(200).json({
            success: true,
            message: "Contacto auto-guardado exitosamente",
            data: contact
        });
    } catch (err) {
        console.error("Error en autoGuardarContacto:", err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * POST /api/empresas/:id_empresa/contactos/upsert
 */
const upsertContactoEmpresa = async (req, res) => {
    try {
        const id_empresa = req.params.id_empresa || req.body.id_empresa || req.body.id_empresa_cliente;
        const id_contacto = req.body.id_contacto ? Number(req.body.id_contacto) : null;
        const nombre = (req.body.nombre || req.body.contacto_nombre || '').trim();
        const fono = (req.body.fono || req.body.telefono || req.body.contacto_telefono || '').trim() || null;
        const email = (req.body.email || req.body.correo || req.body.contacto_email || '').trim() || null;
        const cargo = req.body.cargo || 'Contacto Comercial';
        const id_proyecto = req.body.id_proyecto || null;

        if (!id_empresa) {
            return res.status(400).json({ error: "Falta id_empresa" });
        }
        if (!nombre) {
            return res.status(400).json({ error: "Falta el nombre del contacto" });
        }

        await asegurarTablaContactos();

        let contact = null;

        if (id_contacto) {
            // Actualizar por id_contacto
            const upRes = await pool.query(`
                UPDATE sch_leangsp.tpar_contactos
                SET nombre = $1, fono = $2, email = $3, cargo = $4, updated_at = NOW()
                WHERE id_contacto = $5 AND id_empresa = $6
                RETURNING *;
            `, [nombre, fono, email, cargo, id_contacto, Number(id_empresa)]);

            if (upRes.rowCount > 0) {
                contact = upRes.rows[0];
            }
        }

        if (!contact) {
            // Buscar por nombre en la misma empresa
            const checkRes = await pool.query(`
                SELECT * FROM sch_leangsp.tpar_contactos 
                WHERE id_empresa = $1 AND LOWER(TRIM(nombre)) = LOWER(TRIM($2))
                LIMIT 1
            `, [Number(id_empresa), nombre]);

            if (checkRes.rowCount > 0) {
                const existing = checkRes.rows[0];
                const upRes = await pool.query(`
                    UPDATE sch_leangsp.tpar_contactos 
                    SET fono = COALESCE($1, fono), email = COALESCE($2, email), cargo = COALESCE($3, cargo), updated_at = NOW()
                    WHERE id_contacto = $4
                    RETURNING *;
                `, [fono, email, cargo, existing.id_contacto]);
                contact = upRes.rows[0];
            } else {
                const insRes = await pool.query(`
                    INSERT INTO sch_leangsp.tpar_contactos (id_empresa, nombre, fono, email, cargo)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *;
                `, [Number(id_empresa), nombre, fono, email, cargo]);
                contact = insRes.rows[0];
            }
        }

        // Si viene id_proyecto, vincular
        if (id_proyecto && contact) {
            const pryRes = await pool.query(
                `SELECT id_proyecto, json_field FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1`,
                [Number(id_proyecto)]
            );
            if (pryRes.rowCount > 0) {
                let jf = pryRes.rows[0].json_field;
                if (typeof jf === 'string') {
                    try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
                }
                if (!jf || typeof jf !== 'object') jf = {};
                if (!jf.crm_v1) jf.crm_v1 = {};

                jf.crm_v1.id_contacto = contact.id_contacto;
                jf.crm_v1.contacto_nombre = contact.nombre;
                if (contact.fono) jf.crm_v1.contacto_telefono = contact.fono;
                if (contact.email) jf.crm_v1.contacto_email = contact.email;

                await pool.query(
                    `UPDATE sch_leangsp.tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2`,
                    [JSON.stringify(jf), Number(id_proyecto)]
                );
            }
        }

        await sincronizarPuntosContactoEmpresa(id_empresa, contact);

        return res.status(200).json({
            success: true,
            message: "Contacto guardado correctamente",
            data: contact
        });
    } catch (err) {
        console.error("Error en upsertContactoEmpresa:", err);
        return res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/empresas/:id_empresa/contactos
 */
const getContactosByEmpresa = async (req, res) => {
    try {
        const { id_empresa } = req.params;
        if (!id_empresa) {
            return res.status(400).json({ error: "Falta id_empresa" });
        }

        await asegurarTablaContactos();

        const { rows } = await pool.query(`
            SELECT id_contacto, id_empresa, nombre, fono, email, cargo, created_at
            FROM sch_leangsp.tpar_contactos
            WHERE id_empresa = $1
            ORDER BY nombre ASC;
        `, [Number(id_empresa)]);

        // Si la tabla relacional aún no tiene contactos para esta empresa, verificar legacy en json_field
        if (rows.length === 0) {
            const empRes = await pool.query(
                `SELECT json_field FROM sch_leangsp.tpar_empresas WHERE id_empresa = $1`,
                [Number(id_empresa)]
            );
            if (empRes.rowCount > 0) {
                let empJson = empRes.rows[0].json_field;
                if (typeof empJson === 'string') {
                    try { empJson = JSON.parse(empJson); } catch (_) { empJson = {}; }
                }
                const legacy = empJson?.puntos_contacto || [];
                if (Array.isArray(legacy) && legacy.length > 0) {
                    // Backfill reactivo a tpar_contactos
                    const backfilled = [];
                    for (const item of legacy) {
                        if (item.nombre && item.nombre.trim()) {
                            const insRes = await pool.query(`
                                INSERT INTO sch_leangsp.tpar_contactos (id_empresa, nombre, fono, email, cargo)
                                VALUES ($1, $2, $3, $4, $5)
                                RETURNING *;
                            `, [Number(id_empresa), item.nombre.trim(), item.telefono || null, item.correo || null, item.cargo || 'Contacto Comercial']);
                            if (insRes.rowCount > 0) {
                                backfilled.push(insRes.rows[0]);
                            }
                        }
                    }
                    if (backfilled.length > 0) {
                        return res.status(200).json(backfilled);
                    }
                }
            }
        }

        return res.status(200).json(rows);
    } catch (err) {
        console.error("Error en getContactosByEmpresa:", err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    autoGuardarContacto,
    upsertContactoEmpresa,
    getContactosByEmpresa,
    asegurarTablaContactos,
    sincronizarPuntosContactoEmpresa
};
