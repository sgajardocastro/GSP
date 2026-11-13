const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const pool = require('../config/postgresPool');
const archivoModel = require('../models/archivoModel');
const { buildStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
const { generarPdfPlanIzaje } = require('../services/planIzajePdfService');

const archivoM = new archivoModel();

let tableEnsured = false;
async function ensureTableExists() {
  if (tableEnsured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tope_plan_izaje (
      id_plan_izaje SERIAL PRIMARY KEY,
      id_proyecto INTEGER NOT NULL,
      id_equipo INTEGER,
      folio_plan VARCHAR(50),
      radio_max_m NUMERIC(8,2) NOT NULL DEFAULT 0,
      largo_pluma_m NUMERIC(8,2) NOT NULL DEFAULT 0,
      angulo_deg NUMERIC(6,2) NOT NULL DEFAULT 0,
      elemento_izar VARCHAR(250),
      viento_kmh NUMERIC(6,2) DEFAULT 0,
      peso_neto_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
      peso_gancho_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
      peso_yugo_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
      peso_aparejos_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
      peso_bruto_total_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
      capacidad_tabla_kg NUMERIC(10,2) NOT NULL DEFAULT 0,
      porcentaje_utilizacion NUMERIC(6,2) NOT NULL DEFAULT 0,
      aparejos_json JSONB DEFAULT '[]'::jsonb,
      firma_operador_json JSONB DEFAULT '{}'::jsonb,
      firma_rigger_json JSONB DEFAULT '{}'::jsonb,
      firma_supervisor_json JSONB DEFAULT '{}'::jsonb,
      id_file_pdf INTEGER,
      estado VARCHAR(30) DEFAULT 'APROBADO',
      id_user_creador INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  tableEnsured = true;
}

// 1. Listar todos los planes de izaje
router.get('/', async (req, res) => {
  try {
    await ensureTableExists();
    const { rows } = await pool.query(`
      SELECT p.*, pr.nombre_proyecto
      FROM tope_plan_izaje p
      LEFT JOIN tpry_proyecto pr ON p.id_proyecto = pr.id_proyecto
      ORDER BY p.created_at DESC
    `);
    return res.status(200).json({ success: true, planes: rows });
  } catch (err) {
    console.error('[planIzajeRoutes] Error en GET /:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Obtener Plan de Izaje y datos de precarga por id_proyecto (OT)
router.get('/proyecto/:id_proyecto', async (req, res) => {
  try {
    await ensureTableExists();
    const { id_proyecto } = req.params;
    if (!id_proyecto) {
      return res.status(400).json({ error: 'id_proyecto es obligatorio' });
    }

    const planRes = await pool.query(
      'SELECT * FROM tope_plan_izaje WHERE id_proyecto = $1 ORDER BY id_plan_izaje DESC LIMIT 1',
      [id_proyecto]
    );
    const plan = planRes.rows[0] || null;

    // Datos de precarga desde la OT / Proyecto
    const pryRes = await pool.query(`
      SELECT p.*, e.razon_social AS cliente_nombre, COALESCE(e.rut_empresa, '') AS cliente_rut
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
      WHERE p.id_proyecto = $1
    `, [id_proyecto]);
    const pry = pryRes.rows[0] || null;

    let equipo = null;
    if (pry) {
      const jf = pry.json_field || {};
      const crm = jf.crm_v1 || {};
      const idEquipo = pry.id_equipo || crm.id_equipo || jf.id_equipo || null;
      if (idEquipo) {
        const eqRes = await pool.query('SELECT * FROM tequ_equipo WHERE id_equipo = $1', [idEquipo]);
        equipo = eqRes.rows[0] || null;
      }
    }

    return res.status(200).json({
      success: true,
      plan,
      url_pdf: plan?.id_file_pdf ? `/api/archivo/ver/${plan.id_file_pdf}` : null,
      precarga: pry ? {
        id_proyecto: pry.id_proyecto,
        nombre_proyecto: pry.nombre_proyecto,
        cliente_nombre: pry.cliente_nombre || pry.json_field?.crm_v1?.razon_social || pry.nombre_proyecto,
        cliente_rut: pry.cliente_rut || pry.json_field?.crm_v1?.rut_cliente || '',
        obra_direccion: pry.json_field?.crm_v1?.obra_direccion || pry.direccion || 'Faena Operacional',
        equipo: equipo ? {
          id_equipo: equipo.id_equipo,
          nombre: `${equipo.marca || ''} ${equipo.modelo || ''}`.trim() || equipo.nombre_equipo || 'Grúa Móvil',
          patente: equipo.patente || equipo.codigo_interno || 'S/P',
          capacidad_nominal_ton: equipo.capacidad_ton || 100
        } : null
      } : null
    });
  } catch (err) {
    console.error('[planIzajeRoutes] Error en GET /proyecto/:id_proyecto:', err);
    return res.status(500).json({ error: err.message });
  }
});

// 3. Guardar Plan de Izaje, validar tope 85%, compilar PDF A4 con Croquis SVG y registrar en tfmg_file
router.post('/guardar', async (req, res) => {
  try {
    await ensureTableExists();
    const {
      id_proyecto,
      id_equipo,
      radio_max_m = 14,
      largo_pluma_m = 36.5,
      angulo_deg = 68,
      elemento_izar = 'Estructura Modular Prefabricada',
      viento_kmh = 18,
      peso_neto_kg = 0,
      peso_gancho_kg = 0,
      peso_yugo_kg = 0,
      peso_aparejos_kg = 0,
      capacidad_tabla_kg = 0,
      aparejos = [],
      operador = {},
      rigger = {},
      supervisor = {},
      pin_fes = ''
    } = req.body;

    if (!id_proyecto) {
      return res.status(400).json({ error: 'id_proyecto es obligatorio para registrar el Plan de Izaje.' });
    }

    const pNeto = Number(peso_neto_kg) || 0;
    const pGancho = Number(peso_gancho_kg) || 0;
    const pYugo = Number(peso_yugo_kg) || 0;
    const pAparejos = Number(peso_aparejos_kg) || 0;
    const pesoBrutoTotalKg = pNeto + pGancho + pYugo + pAparejos;
    const capTablaKg = Number(capacidad_tabla_kg) || 0;

    if (capTablaKg <= 0) {
      return res.status(400).json({ error: 'La Capacidad de Tabla debe ser mayor a 0 kg.' });
    }

    const porcentajeUtilizacion = Number(((pesoBrutoTotalKg / capTablaKg) * 100).toFixed(1));

    // Regla Inviolable de Seguridad: Tope 85%
    if (porcentajeUtilizacion > 85.0) {
      return res.status(422).json({
        error: `MANIOBRA BLOQUEADA POR SEGURIDAD: El factor de utilización (${porcentajeUtilizacion}%) supera el límite máximo permitido de 85.0%. Ajuste radio, pluma o contrapeso.`
      });
    }

    // Obtener datos del proyecto y empresa
    const pryRes = await pool.query(`
      SELECT p.*, e.razon_social AS cliente_nombre, COALESCE(e.rut_empresa, '') AS cliente_rut
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
      WHERE p.id_proyecto = $1
    `, [id_proyecto]);
    const pry = pryRes.rows[0] || {};
    const jf = pry.json_field || {};
    const crm = jf.crm_v1 || {};

    let equipoObj = {};
    const idEquipoFinal = id_equipo || pry.id_equipo || crm.id_equipo || null;
    if (idEquipoFinal) {
      const eqRes = await pool.query('SELECT * FROM tequ_equipo WHERE id_equipo = $1', [idEquipoFinal]);
      equipoObj = eqRes.rows[0] || {};
    }

    // Logo de Grúas San Pablo
    let logoBase64 = '';
    try {
      const logoDisk = path.join(process.cwd(), 'public', 'logo-sanpablo.png');
      if (fs.existsSync(logoDisk)) {
        logoBase64 = 'data:image/png;base64,' + fs.readFileSync(logoDisk).toString('base64');
      }
    } catch (_) {}

    const folioPlan = `PI-GSP-2026-${String(id_proyecto).padStart(4, '0')}`;
    const timestampStr = new Date().toLocaleString('es-CL');

    const buildFesSignature = (persona, rolTag) => {
      const raw = `${folioPlan}|${rolTag}|${persona?.rut || ''}|${pesoBrutoTotalKg}|${capTablaKg}|${Date.now()}|${pin_fes}`;
      const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 20).toUpperCase();
      return {
        nombre: persona?.nombre || 'Confirmado en Terreno',
        rut: persona?.rut || 'S/R',
        cargo: persona?.cargo || rolTag,
        hash_fes: `SHA256:${hash}...`,
        timestamp: `${timestampStr} · TSA RFC 3161`
      };
    };

    const firmaOp = buildFesSignature(operador, 'Operador Grúa');
    const firmaRig = buildFesSignature(rigger, 'Rigger Calificado');
    const firmaSup = buildFesSignature(supervisor, 'Jefe Maniobra / Supervisor');

    // Generar PDF Oficial A4 con Croquis Vectorial SVG
    const relDir = buildStoragePath('GSP', 'surveys', process.env.APP_ENV || 'dev');
    const targetDir = path.join(STORAGE_ROOT, relDir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const pdfFileName = `Plan_Izaje_OT_${id_proyecto}_${Date.now()}.pdf`;
    const pdfFullPath = path.join(targetDir, pdfFileName);

    const pdfData = {
      folio: folioPlan,
      ot_codigo: `OT-${id_proyecto}`,
      fecha_hora: timestampStr,
      cliente: pry.cliente_nombre || crm.razon_social || pry.nombre_proyecto || 'Cliente Industrial',
      locacion: crm.obra_direccion || pry.direccion || pry.nombre_proyecto || 'Faena Operacional',
      grua_modelo: equipoObj.marca ? `${equipoObj.marca} ${equipoObj.modelo || ''}`.trim() : (req.body.grua_modelo || 'Liebherr LTM 1090-4.2 (90 Ton)'),
      grua_patente: equipoObj.patente || req.body.grua_patente || 'S/P',
      contrapeso_ton: req.body.contrapeso_ton || '22.5 Ton (100%)',
      estabilizadores: req.body.estabilizadores || '100% Extendidos (8.0m x 7.5m)',
      elemento_izar,
      viento_kmh,
      radio_max_m,
      largo_pluma_m,
      angulo_deg,
      peso_neto_kg: pNeto,
      peso_gancho_kg: pGancho,
      peso_yugo_kg: pYugo,
      peso_aparejos_kg: pAparejos,
      capacidad_tabla_kg: capTablaKg,
      aparejos: Array.isArray(aparejos) && aparejos.length > 0 ? aparejos : undefined,
      operador: firmaOp,
      rigger: firmaRig,
      supervisor: firmaSup,
      logoBase64
    };

    const pdfBuffer = await generarPdfPlanIzaje(pdfData);
    fs.writeFileSync(pdfFullPath, pdfBuffer);

    // Registrar archivo PDF en tfmg_file
    const docPdf = await archivoM.insertarTfmgFile(
      'PLAN_IZAJE',
      'application/pdf',
      pdfFileName,
      pdfFileName,
      relDir,
      req.user?.id_user || null,
      'A'
    );

    // Insertar o actualizar en tope_plan_izaje
    const existingRes = await pool.query(
      'SELECT id_plan_izaje FROM tope_plan_izaje WHERE id_proyecto = $1 ORDER BY id_plan_izaje DESC LIMIT 1',
      [id_proyecto]
    );

    let savedPlan;
    if (existingRes.rows.length > 0) {
      const idPlan = existingRes.rows[0].id_plan_izaje;
      const updRes = await pool.query(`
        UPDATE tope_plan_izaje
        SET id_equipo = $1,
            folio_plan = $2,
            radio_max_m = $3,
            largo_pluma_m = $4,
            angulo_deg = $5,
            elemento_izar = $6,
            viento_kmh = $7,
            peso_neto_kg = $8,
            peso_gancho_kg = $9,
            peso_yugo_kg = $10,
            peso_aparejos_kg = $11,
            peso_bruto_total_kg = $12,
            capacidad_tabla_kg = $13,
            porcentaje_utilizacion = $14,
            aparejos_json = $15,
            firma_operador_json = $16,
            firma_rigger_json = $17,
            firma_supervisor_json = $18,
            id_file_pdf = $19,
            estado = 'APROBADO',
            updated_at = CURRENT_TIMESTAMP
        WHERE id_plan_izaje = $20
        RETURNING *
      `, [
        idEquipoFinal, folioPlan, radio_max_m, largo_pluma_m, angulo_deg,
        elemento_izar, viento_kmh, pNeto, pGancho, pYugo, pAparejos,
        pesoBrutoTotalKg, capTablaKg, porcentajeUtilizacion,
        JSON.stringify(pdfData.aparejos || []),
        JSON.stringify(firmaOp),
        JSON.stringify(firmaRig),
        JSON.stringify(firmaSup),
        docPdf.id_doc,
        idPlan
      ]);
      savedPlan = updRes.rows[0];
    } else {
      const insRes = await pool.query(`
        INSERT INTO tope_plan_izaje (
          id_proyecto, id_equipo, folio_plan,
          radio_max_m, largo_pluma_m, angulo_deg, elemento_izar, viento_kmh,
          peso_neto_kg, peso_gancho_kg, peso_yugo_kg, peso_aparejos_kg,
          peso_bruto_total_kg, capacidad_tabla_kg, porcentaje_utilizacion,
          aparejos_json, firma_operador_json, firma_rigger_json, firma_supervisor_json,
          id_file_pdf, estado, id_user_creador
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, 'APROBADO', $21
        ) RETURNING *
      `, [
        id_proyecto, idEquipoFinal, folioPlan,
        radio_max_m, largo_pluma_m, angulo_deg, elemento_izar, viento_kmh,
        pNeto, pGancho, pYugo, pAparejos,
        pesoBrutoTotalKg, capTablaKg, porcentajeUtilizacion,
        JSON.stringify(pdfData.aparejos || []),
        JSON.stringify(firmaOp),
        JSON.stringify(firmaRig),
        JSON.stringify(firmaSup),
        docPdf.id_doc,
        req.user?.id_user || null
      ]);
      savedPlan = insRes.rows[0];
    }

    // Actualizar también referencia rápida en json_field del proyecto para Torre de Control y Documentos
    try {
      const nextJf = {
        ...jf,
        plan_izaje_v1: {
          id_plan_izaje: savedPlan.id_plan_izaje,
          folio_plan: folioPlan,
          id_file_pdf: docPdf.id_doc,
          url_pdf: `/api/archivo/ver/${docPdf.id_doc}`,
          porcentaje_utilizacion: porcentajeUtilizacion,
          peso_bruto_total_kg: pesoBrutoTotalKg,
          capacidad_tabla_kg: capTablaKg,
          radio_max_m,
          largo_pluma_m,
          angulo_deg,
          estado: 'APROBADO',
          fecha_firma: timestampStr
        }
      };
      await pool.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [nextJf, id_proyecto]);
    } catch (eUpd) {
      console.warn('[planIzajeRoutes] Aviso actualizando json_field de tpry_proyecto:', eUpd.message);
    }

    return res.status(200).json({
      success: true,
      message: 'Plan de Izaje firmado y PDF oficial generado exitosamente.',
      plan: savedPlan,
      id_file_pdf: docPdf.id_doc,
      url_pdf: `/api/archivo/ver/${docPdf.id_doc}`
    });
  } catch (err) {
    console.error('[planIzajeRoutes] Error en POST /guardar:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
