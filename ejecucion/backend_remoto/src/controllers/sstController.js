const pool = require("../config/postgresPool");
const { generarPDFDesdeHtml } = require("../services/exportService");
const archivoController = require("./archivoController");
const path = require("path");
const { config } = require("../config/config");

const getOrCreateInforme = async (req, res) => {
    const { id_empresa, id_proyecto, id_periodo, tipo = 'SST' } = req.body;
    console.log("getOrCreateInforme QA recibido:", { id_empresa, id_proyecto, id_periodo, tipo });

    try {
        const querySelect = `
            SELECT * FROM sch_leansurvey_qa.tsst_informes 
            WHERE id_proyecto = $1 AND id_periodo = $2::varchar AND tipo_informe = $3
        `;
        const result = await pool.query(querySelect, [id_proyecto, id_periodo, tipo]);

        if (result.rows.length > 0) {
            return res.status(200).json(result.rows[0]);
        }

        const queryInsert = `
            INSERT INTO sch_leansurvey_qa.tsst_informes (
                id_empresa, id_proyecto, id_periodo, tipo_informe, estado, data_json
            ) VALUES ($1, $2, $3, $4, 'borrador', $5)
            RETURNING *
        `;

        const defaultData = {
            protocolos_minsal: [],
            metas_mandante: [],
            observaciones: ""
        };

        const newInforme = await pool.query(queryInsert, [
            id_empresa,
            id_proyecto,
            id_periodo,
            tipo,
            JSON.stringify(defaultData)
        ]);

        res.status(201).json(newInforme.rows[0]);
    } catch (error) {
        console.error("Error en getOrCreateInforme QA:", error.message);
        res.status(500).json({ error: "No se pudo obtener o crear el informe en QA." });
    }
};

const getAccidentabilidad = async (req, res) => {
    const { id_informe } = req.params;
    try {
        const result = await pool.query("SELECT * FROM sch_leansurvey_qa.tsst_accidentabilidad WHERE id_informe = $1 ORDER BY fecha_suceso DESC", [id_informe]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error en getAccidentabilidad QA:", error.message);
        res.status(500).json({ error: "Error al obtener registros." });
    }
};

const saveAccidentabilidad = async (req, res) => {
    const { id_accidentabilidad, id_informe, ...data } = req.body;
    try {
        if (id_accidentabilidad) {
            const fields = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(", ");
            const values = Object.values(data);
            const query = `UPDATE sch_leansurvey_qa.tsst_accidentabilidad SET ${fields} WHERE id_accidentabilidad = $${values.length + 1} RETURNING *`;
            const result = await pool.query(query, [...values, id_accidentabilidad]);
            res.json(result.rows[0]);
        } else {
            const keys = Object.keys(data);
            const values = Object.values(data);
            const placeholders = keys.map((_, i) => `$${i + 2}`).join(", ");
            const query = `INSERT INTO sch_leansurvey_qa.tsst_accidentabilidad (id_informe, ${keys.join(", ")}) VALUES ($1, ${placeholders}) RETURNING *`;
            const result = await pool.query(query, [id_informe, ...values]);
            res.status(201).json(result.rows[0]);
        }
    } catch (error) {
        console.error("Error en saveAccidentabilidad QA:", error.message);
        res.status(500).json({ error: "Error al guardar accidentabilidad." });
    }
};

const deleteAccidentabilidad = async (req, res) => {
    const { id_accidentabilidad } = req.params;
    try {
        await pool.query("DELETE FROM sch_leansurvey_qa.tsst_accidentabilidad WHERE id_accidentabilidad = $1", [id_accidentabilidad]);
        res.json({ message: "Registro eliminado." });
    } catch (error) {
        console.error("Error en deleteAccidentabilidad QA:", error.message);
        res.status(500).json({ error: "Error al eliminar." });
    }
};

const updateInforme = async (req, res) => {
    const { id_informe } = req.params;
    const data = { ...req.body };
    try {
        const isTransmac = config.dbUser && config.dbUser.includes('transmac');
        if (isTransmac && 'estado' in data) {
            data.status = data.estado;
            delete data.estado;
        }
        let SCHEMA = 'sch_leansurvey_qa';
        if (config.dbSchema) {
            SCHEMA = config.dbSchema;
        } else if (isTransmac) {
            if (config.dbUser.includes('dev')) SCHEMA = 'sch_leangsp';
            else if (config.dbUser.includes('qa')) SCHEMA = 'sch_leantransmac_qa';
            else SCHEMA = 'sch_leantransmac_prod';
        } else if (config.dbUser && config.dbUser.includes('dev')) {
            SCHEMA = 'sch_leansurvey_dev';
        }

        const fields = Object.keys(data).map((key, i) => `${key} = $${i + 1}`).join(", ");
        const values = Object.values(data);
        
        let query;
        if (isTransmac) {
            query = `UPDATE ${SCHEMA}.tsst_audits SET ${fields} WHERE id = $${values.length + 1} RETURNING *`;
        } else {
            query = `UPDATE ${SCHEMA}.tsst_informes SET ${fields} WHERE id_informe = $${values.length + 1} RETURNING *`;
        }

        const result = await pool.query(query, [...values, id_informe]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error("Error en updateInforme:", error.message);
        res.status(500).json({ error: "Error al actualizar." });
    }
};

const getIncidentes = async (req, res) => {
    const { id_informe } = req.params;
    try {
        const result = await pool.query("SELECT * FROM sch_leansurvey_qa.tsst_incidentes WHERE id_informe = $1 ORDER BY fecha_incidente DESC", [id_informe]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error en getIncidentes QA:", error.message);
        res.status(500).json({ error: "Error al obtener incidentes." });
    }
};

const saveIncidente = async (req, res) => {
    const data = req.body;
    const { id_incidente } = data;
    try {
        if (id_incidente) {
            const fields = Object.keys(data).filter(k => k !== 'id_incidente').map((key, i) => `${key} = $${i + 1}`).join(", ");
            const values = Object.keys(data).filter(k => k !== 'id_incidente').map(k => data[k]);
            const query = `UPDATE sch_leansurvey_qa.tsst_incidentes SET ${fields} WHERE id_incidente = $${values.length + 1} RETURNING *`;
            const result = await pool.query(query, [...values, id_incidente]);
            res.json(result.rows[0]);
        } else {
            const filteredData = { ...data };
            if (!filteredData.id_incidente) delete filteredData.id_incidente;
            const fields = Object.keys(filteredData).join(", ");
            const placeholders = Object.keys(filteredData).map((_, i) => `$${i + 1}`).join(", ");
            const values = Object.values(filteredData);
            const query = `INSERT INTO sch_leansurvey_qa.tsst_incidentes (${fields}) VALUES (${placeholders}) RETURNING *`;
            const result = await pool.query(query, values);
            res.json(result.rows[0]);
        }
    } catch (error) {
        console.error("Error en saveIncidente QA:", error.message);
        res.status(500).json({ error: "Error al guardar incidente." });
    }
};

const deleteIncidente = async (req, res) => {
    const { id_incidente } = req.params;
    try {
        await pool.query("DELETE FROM sch_leansurvey_qa.tsst_incidentes WHERE id_incidente = $1", [id_incidente]);
        res.json({ message: "Eliminado." });
    } catch (error) {
        res.status(500).json({ error: "Error." });
    }
};

const savePDFFromHtml = async (req, res) => {
    const { id_informe } = req.params;
    const { htmlContent } = req.body;

    try {
        const isTransmac = config.dbUser && config.dbUser.includes('transmac');
        let SCHEMA = 'sch_leansurvey_qa';
        if (config.dbSchema) {
            SCHEMA = config.dbSchema;
        } else if (isTransmac) {
            if (config.dbUser.includes('dev')) SCHEMA = 'sch_leangsp';
            else if (config.dbUser.includes('qa')) SCHEMA = 'sch_leantransmac_qa';
            else SCHEMA = 'sch_leantransmac_prod';
        } else if (config.dbUser && config.dbUser.includes('dev')) {
            SCHEMA = 'sch_leansurvey_dev';
        }

        let query;
        if (isTransmac) {
            query = `
                SELECT a.*, t.name as tipo_informe 
                FROM ${SCHEMA}.tsst_audits a 
                JOIN ${SCHEMA}.tsst_auditory_types t ON a.type_id = t.id 
                WHERE a.id = $1
            `;
        } else {
            query = `SELECT * FROM ${SCHEMA}.tsst_informes WHERE id_informe = $1`;
        }

        const informeRes = await pool.query(query, [id_informe]);

        if (informeRes.rows.length === 0) return res.status(404).json({ error: "Informe no encontrado." });
        const informe = informeRes.rows[0];

        const folderName = informe.tipo_informe === "AUDITORIA" ? "auditoria" : "sst_informes";
        const path_base = `/u05/LeanDocs/${folderName}/`;
        const fileName = `${informe.tipo_informe}_${id_informe.substring(0, 8)}_${Date.now()}.pdf`;

        const tempPath = await generarPDFDesdeHtml(htmlContent, fileName);

        const archivoId = await archivoController.guardarArchivoDesdeRuta({
            filePath: tempPath,
            tipo_doc: informe.tipo_informe === "AUDITORIA" ? "INFORME_AUDITORIA" : "INFORME_SST",
            mimetype: "application/pdf",
            path_doc: path_base,
            id_user: 1, 
            estado: "ACTIVO"
        });

        const url_pdf = `/archivo/${folderName}/${archivoId.name_doc_interno}`;
        
        let updateQuery;
        if (isTransmac) {
            updateQuery = `UPDATE ${SCHEMA}.tsst_audits SET url_pdf = $1 WHERE id = $2`;
        } else {
            updateQuery = `UPDATE ${SCHEMA}.tsst_informes SET url_pdf = $1 WHERE id_informe = $2`;
        }
        await pool.query(updateQuery, [url_pdf, id_informe]);

        res.json({ url_pdf });
    } catch (error) {
        console.error("Error en savePDFFromHtml:", error.message);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getOrCreateInforme,
    getAccidentabilidad,
    saveAccidentabilidad,
    deleteAccidentabilidad,
    getIncidentes,
    saveIncidente,
    deleteIncidente,
    updateInforme,
    savePDFFromHtml
};
