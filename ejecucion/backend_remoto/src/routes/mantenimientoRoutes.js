const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mantenimientoController = require('../controllers/mantenimientoController');
const pool = require('../config/postgresPool');

const jwtSecret = process.env.JWT_SECRET || 'secret';
const jwtEncryptSecret = process.env.JWT_ENCRYPT_SECRET || 'encrypt-secret';

function decryptToken(encryptedToken, secret) {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
    let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

// Middleware de resolución de identidad real (JWT + Header X-User-Id + Payload) sin usuario fijo en duro
const authOrFallback = async (req, res, next) => {
  let resolvedUser = null;

  const authHeader = req.headers['authorization'];
  if (authHeader) {
    try {
      const parts = authHeader.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        const decrypted = decryptToken(parts[1], jwtEncryptSecret) || parts[1];
        try {
          resolvedUser = jwt.verify(decrypted, jwtSecret);
        } catch (_) {
          resolvedUser = jwt.decode(decrypted) || null;
        }
      }
    } catch (_) {
      // Continuar a resolución por X-User-Id / payload
    }
  }

  // Si viene X-User-Id de la sesión activa o id_user_creador/id_user explícito en el body, priorizar cuando no hay token o difiere
  const explicitUserId = Number(
    req.body?.id_user_creador ||
    req.body?.id_user ||
    req.headers['x-user-id'] ||
    req.query?.id_user ||
    0
  );

  if (explicitUserId > 0 && (!resolvedUser || !resolvedUser.id_user || Number(resolvedUser.id_user) !== explicitUserId)) {
    resolvedUser = {
      ...(resolvedUser || {}),
      id_user: explicitUserId,
      id_empresa: resolvedUser?.id_empresa || 9
    };
  }

  if (resolvedUser && resolvedUser.id_user) {
    try {
      const { rows: uRows } = await pool.query(
        `SELECT id_user, name_frst, apellido_pat, email FROM tsec_users WHERE id_user = $1 LIMIT 1`,
        [resolvedUser.id_user]
      );
      if (uRows.length > 0) {
        resolvedUser.name_frst = uRows[0].name_frst;
        resolvedUser.apellido_pat = uRows[0].apellido_pat;
        resolvedUser.email = uRows[0].email;
      }
      const { rows: rRows } = await pool.query(
        `SELECT r.name_rol FROM tsec_user_roles ur JOIN tsec_roles r ON ur.id_rol = r.id_rol WHERE ur.id_user = $1 AND (r.activo IS NULL OR r.activo = true)`,
        [resolvedUser.id_user]
      );
      resolvedUser.roles = rRows.map(r => r.name_rol);
    } catch (_) {
      resolvedUser.roles = resolvedUser.roles || [];
    }
    req.user = { ...resolvedUser, id_empresa: resolvedUser.id_empresa || 9 };
    return next();
  }

  req.user = {
    id_user: req.body?.id_tecnico_responsable ? Number(req.body.id_tecnico_responsable) : null,
    id_empresa: 9,
    roles: ['GSP_TALLER_EJEC']
  };
  next();
};

// =============================================================================
// 1. ORDENES DE TRABAJO (OT) & CICLO DE VIDA
// =============================================================================
router.get('/ots', authOrFallback, (req, res) => mantenimientoController.getOts(req, res));
router.get('/ots/:id', authOrFallback, (req, res) => mantenimientoController.getOtById(req, res));
router.post('/ots', authOrFallback, (req, res) => mantenimientoController.crearOt(req, res));
router.put('/ots/:id/estado', authOrFallback, (req, res) => mantenimientoController.cambiarEstadoOt(req, res));
router.put('/ots/:id/medidores-inicio', authOrFallback, (req, res) => mantenimientoController.actualizarMedidoresInicio(req, res));
router.post('/ots/:id/fotos-360', authOrFallback, (req, res) => mantenimientoController.guardarFoto360(req, res));
router.delete('/ots/:id/fotos-360/:posicion', authOrFallback, (req, res) => mantenimientoController.eliminarFoto360(req, res));
router.put('/ots/:id/anular', authOrFallback, (req, res) => mantenimientoController.anularOt(req, res));
router.post('/ots/:id/cerrar', authOrFallback, (req, res) => mantenimientoController.cerrarOt(req, res));

// =============================================================================
// 2. CHECKLIST Y ACTIVIDADES
// =============================================================================
router.post('/ots/:id/actividades', authOrFallback, (req, res) => mantenimientoController.agregarActividad(req, res));
router.put('/actividades/:idActividad/estado', authOrFallback, (req, res) => mantenimientoController.actualizarEstadoActividad(req, res));
router.delete('/actividades/:idActividad', authOrFallback, (req, res) => mantenimientoController.eliminarActividad(req, res));
router.post('/actividades/:idActividad/comentarios', authOrFallback, (req, res) => mantenimientoController.agregarComentarioActividad(req, res));
router.post('/actividades/:idActividad/fotos', authOrFallback, (req, res) => mantenimientoController.adjuntarFotoActividad(req, res));
router.delete('/actividades/:idActividad/fotos/:idFoto', authOrFallback, (req, res) => mantenimientoController.eliminarFotoActividad(req, res));

// =============================================================================
// 3. MATERIALES / REPUESTOS (FASE 1 SIN WMS)
// =============================================================================
router.post('/ots/:id/materiales', authOrFallback, (req, res) => mantenimientoController.agregarMaterialManual(req, res));
router.delete('/materiales/:idRepuesto', authOrFallback, (req, res) => mantenimientoController.eliminarMaterial(req, res));

// =============================================================================
// 4. MANO DE OBRA HH
// =============================================================================
router.post('/ots/:id/hh', authOrFallback, (req, res) => mantenimientoController.agregarHh(req, res));
router.delete('/hh/:idHh', authOrFallback, (req, res) => mantenimientoController.eliminarHh(req, res));

// =============================================================================
// 5. SERVICIOS EXTERNOS TERCERIZADOS
// =============================================================================
router.post('/ots/:id/servicios-externos', authOrFallback, (req, res) => mantenimientoController.agregarServicioExt(req, res));
router.delete('/servicios-externos/:idServicioExt', authOrFallback, (req, res) => mantenimientoController.eliminarServicioExt(req, res));

// =============================================================================
// 6. HALLAZGOS DURANTE LA MANTENCIÓN (C1 - C4)
// =============================================================================
router.get('/hallazgos', authOrFallback, (req, res) => mantenimientoController.getHallazgos(req, res));
router.post('/hallazgos', authOrFallback, (req, res) => mantenimientoController.crearHallazgo(req, res));
router.put('/hallazgos/:id', authOrFallback, (req, res) => mantenimientoController.actualizarHallazgo(req, res));
router.put('/hallazgos/:id/resolver', authOrFallback, (req, res) => mantenimientoController.resolverHallazgo(req, res));

// =============================================================================
// 7. AVISOS DE AVERÍA
// =============================================================================
router.get('/avisos', authOrFallback, (req, res) => mantenimientoController.getAvisos(req, res));
router.post('/avisos', authOrFallback, (req, res) => mantenimientoController.crearAviso(req, res));

// =============================================================================
// 8. PAUTAS PREVENTIVAS CÍCLICAS (PM250, PM500, ETC.)
// =============================================================================
router.get('/pautas', authOrFallback, (req, res) => mantenimientoController.getPautas(req, res));

// =============================================================================
// 9. RADAR DE FLOTA & HORÓMETROS 360°
// =============================================================================
router.get('/flota/radar', authOrFallback, (req, res) => mantenimientoController.getRadarFlota(req, res));

// =============================================================================
// 10. HOJA DE VIDA DEL ACTIVO (PASAPORTE TÉCNICO)
// =============================================================================
router.get('/equipo/:id/hoja-vida', authOrFallback, (req, res) => mantenimientoController.getHojaVidaEquipo(req, res));

// =============================================================================
// 11. DASHBOARD DE INDICADORES ENTERPRISE (KPIS)
// =============================================================================
router.get('/kpis', authOrFallback, (req, res) => mantenimientoController.getKpis(req, res));

// =============================================================================
// 12. PARÁMETROS OPERACIONALES DEL TALLER
// =============================================================================
router.get('/parametros', authOrFallback, (req, res) => mantenimientoController.getParametros(req, res));
router.put('/parametros', authOrFallback, (req, res) => mantenimientoController.actualizarParametro(req, res));

// =============================================================================
// 13. TÉCNICOS Y MECÁNICOS
// =============================================================================
router.get('/tecnicos', authOrFallback, (req, res) => mantenimientoController.getTecnicos(req, res));

module.exports = router;
