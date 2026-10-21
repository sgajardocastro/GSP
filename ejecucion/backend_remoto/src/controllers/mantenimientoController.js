const mantenimientoModel = require('../models/mantenimientoModel');
const notificacionService = require('../services/notificacionService');

class MantenimientoController {
  // Helper para resolver id_empresa
  _getEmpresaId(req) {
    return req.user?.id_empresa || parseInt(req.query.id_empresa || req.body?.id_empresa || 9, 10);
  }

  // =========================================================================
  // 1. ORDENES DE TRABAJO (OT)
  // =========================================================================

  // GET /api/mantenimiento/ots
  async getOts(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const filtros = {
        tipo: req.query.tipo,
        estado: req.query.estado,
        prioridad: req.query.prioridad,
        id_equipo: req.query.id_equipo,
        search: req.query.search
      };
      const ots = await mantenimientoModel.getOts(empresaId, filtros);
      return res.status(200).json({ success: true, count: ots.length, data: ots });
    } catch (err) {
      console.error('Error en MantenimientoController.getOts:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // GET /api/mantenimiento/ots/:id
  async getOtById(req, res) {
    try {
      const { id } = req.params;
      const empresaId = this._getEmpresaId(req);
      const result = await mantenimientoModel.getOtById(id, empresaId);

      if (!result) {
        return res.status(404).json({ success: false, error: 'Orden de trabajo no encontrada.' });
      }

      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      console.error('Error en MantenimientoController.getOtById:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/mantenimiento/ots
  async crearOt(req, res) {
    try {
      const data = req.body;
      if (!data.id_equipo) {
        return res.status(400).json({ success: false, error: 'Debe especificar el equipo a intervenir (id_equipo).' });
      }

      const user = req.user || { id_user: 55, id_empresa: 9 };
      const nuevaOt = await mantenimientoModel.crearOt(data, user);

      // Notificación omnicanal al técnico asignado con deep link directo a la PWA
      if (nuevaOt.id_tecnico_responsable) {
        try {
          const pool = require('../config/postgresPool');
          const { rows: tecRows } = await pool.query(
            'SELECT id_user, name_frst, apellido_pat, email, movil AS phone FROM tsec_users WHERE id_user = $1',
            [nuevaOt.id_tecnico_responsable]
          );
          const { rows: eqRows } = await pool.query(
            'SELECT patente, modelo FROM tequ_equipo WHERE id_equipo = $1',
            [nuevaOt.id_equipo]
          );
          if (tecRows.length > 0) {
            const tec = tecRows[0];
            const eq = eqRows[0] || { patente: 'S/P', modelo: 'Grúa' };
            await notificacionService.despacharNotificacion({
              evento: 'MNT_OT_ASIGNADA',
              canales: ['EMAIL', 'WHATSAPP'],
              destinatario: { nombre: `${tec.name_frst || ''} ${tec.apellido_pat || ''}`.trim(), email: tec.email, telefono: tec.phone },
              deepLink: { tipoApp: 'PWA', ruta: `taller/ot/${nuevaOt.id_ot}` },
              emailData: {
                asunto: `Asignación de OT Taller: ${nuevaOt.numero_ot} (${eq.patente})`,
                titulo: `Nueva OT Asignada: ${nuevaOt.numero_ot}`,
                subtitulo: `Has sido asignado como técnico responsable`,
                contenido: `<p>Estimado/a <strong>${tec.name_frst || 'Técnico'}</strong>,</p><p>Se te ha asignado la orden <strong>${nuevaOt.numero_ot}</strong> para el equipo <strong>${eq.patente} (${eq.modelo})</strong>.</p><p><strong>Tipo:</strong> ${nuevaOt.tipo_mantenimiento}</p><p><strong>Motivo / Falla:</strong> ${nuevaOt.descripcion_falla}</p>`,
                botonTexto: 'ABRIR OT EN TALLER MÓVIL'
              },
              wspData: {
                mensaje: `🔧 *ASIGNACIÓN DE OT TALLER — GSP*\n\nHola ${tec.name_frst || 'Técnico'}, se te ha asignado la *OT ${nuevaOt.numero_ot}*.\n🚜 *Equipo:* ${eq.patente} (${eq.modelo})\n📋 *Tipo:* ${nuevaOt.tipo_mantenimiento}\n⚠️ *Falla/Pauta:* ${nuevaOt.descripcion_falla}`
              }
            });
          }
        } catch (notifTecErr) {
          console.warn('Advertencia: fallo notificación al técnico:', notifTecErr.message);
        }
      }

      // Notificación si es correctiva urgente (Prioridad 1)
      if (nuevaOt.prioridad === 1) {
        try {
          await notificacionService.despacharNotificacion({
            evento: 'MNT_OT_CRITICA_CREADA',
            usuarioDestino: { nombre: 'Supervisor Taller' },
            emailData: {
              asunto: `⚠️ ALERTA: OT Crítica ${nuevaOt.numero_ot} Creada - Equipo Detenido`,
              titulo: `OT Crítica Generada: ${nuevaOt.numero_ot}`,
              cuerpoHtml: `<p>Se ha generado la OT de prioridad ALTA/CRÍTICA <strong>${nuevaOt.numero_ot}</strong> para el equipo ID <strong>${nuevaOt.id_equipo}</strong>.</p><p><strong>Motivo / Falla:</strong> ${nuevaOt.descripcion_falla}</p>`
            },
            mensajeWsp: `🚨 *ALERTA TALLER GSP* 🚨\nSe ha generado la OT Crítica *${nuevaOt.numero_ot}*.\nFalla: ${nuevaOt.descripcion_falla}.\nEl equipo se encuentra *FUERA DE SERVICIO*.`,
            deepLinkData: { modulo: 'mantenimiento', accion: 'ver', id: nuevaOt.id_ot }
          });
        } catch (notifErr) {
          console.warn('Advertencia: fallo despacho de notificación OT crítica:', notifErr.message);
        }
      }

      return res.status(201).json({ success: true, message: 'Orden de trabajo creada exitosamente', data: nuevaOt });
    } catch (err) {
      if (err.code === 'EQUIPO_CON_OT_ACTIVA') {
        return res.status(409).json({
          success: false,
          error: err.message,
          code: 'EQUIPO_CON_OT_ACTIVA',
          ot_activa: err.ot_activa
        });
      }
      console.error('Error en MantenimientoController.crearOt:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/mantenimiento/ots/:id/estado
  async cambiarEstadoOt(req, res) {
    try {
      const { id } = req.params;
      const { nuevo_estado, motivo } = req.body;
      if (!nuevo_estado) {
        return res.status(400).json({ success: false, error: 'Debe especificar el nuevo estado.' });
      }

      const user = req.user || { id_user: 55, id_empresa: 9 };
      const resultado = await mantenimientoModel.cambiarEstadoOt(id, nuevo_estado, motivo, user);
      return res.status(200).json({ success: true, message: `Estado actualizado a ${nuevo_estado}`, data: resultado });
    } catch (err) {
      console.error('Error en MantenimientoController.cambiarEstadoOt:', err);
      return res.status(422).json({ success: false, error: err.message });
    }
  }

  // PUT /api/mantenimiento/ots/:id/medidores-inicio
  async actualizarMedidoresInicio(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const user = req.user || { id_user: 55, id_empresa: 9 };
      const resultado = await mantenimientoModel.actualizarMedidoresInicio(id, data, user.id_empresa);
      return res.status(200).json({ success: true, message: 'Medidores de entrada actualizados', data: resultado });
    } catch (err) {
      console.error('Error en MantenimientoController.actualizarMedidoresInicio:', err);
      return res.status(422).json({ success: false, error: err.message });
    }
  }

  // POST /api/mantenimiento/ots/:id/fotos-360
  async guardarFoto360(req, res) {
    try {
      const { id } = req.params;
      const { posicion, id_doc, url } = req.body;
      if (!posicion) {
        return res.status(400).json({ success: false, error: 'La posición fotográfica es obligatoria.' });
      }
      const user = req.user || { id_user: 55, id_empresa: 9 };
      const fotos = await mantenimientoModel.guardarFoto360(id, { posicion, id_doc, url }, user.id_empresa);
      return res.status(200).json({ success: true, message: 'Foto 360 guardada correctamente', data: fotos });
    } catch (err) {
      console.error('Error en MantenimientoController.guardarFoto360:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/mantenimiento/ots/:id/fotos-360/:posicion
  async eliminarFoto360(req, res) {
    try {
      const { id, posicion } = req.params;
      const user = req.user || { id_user: 55, id_empresa: 9 };
      const fotos = await mantenimientoModel.eliminarFoto360(id, posicion, user.id_empresa);
      return res.status(200).json({ success: true, message: 'Foto 360 eliminada', data: fotos });
    } catch (err) {
      console.error('Error en MantenimientoController.eliminarFoto360:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/mantenimiento/ots/:id/anular
  async anularOt(req, res) {
    try {
      const { id } = req.params;
      const { motivo } = req.body;
      if (!motivo) {
        return res.status(400).json({ success: false, error: 'El motivo de anulación es obligatorio.' });
      }

      const user = req.user || { id_user: 55, id_empresa: 9 };
      const resultado = await mantenimientoModel.anularOt(id, motivo, user);
      return res.status(200).json({ success: true, message: 'Orden de trabajo anulada', data: resultado });
    } catch (err) {
      console.error('Error en MantenimientoController.anularOt:', err);
      return res.status(422).json({ success: false, error: err.message });
    }
  }

  // POST /api/mantenimiento/ots/:id/cerrar
  async cerrarOt(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!data.pin) {
        return res.status(400).json({ success: false, error: 'Debe ingresar el PIN de 4 dígitos para firmar el cierre.' });
      }

      const user = req.user || { id_user: data.id_user_cierre || 1, id_empresa: 9 };
      const cierre = await mantenimientoModel.cerrarOt(id, data, user);

      // Notificación si el costo total excede el umbral
      if (cierre.costo_total_ot >= 2000000) {
        try {
          await notificacionService.despacharNotificacion({
            evento: 'MNT_COSTO_SOBRE_UMBRAL',
            usuarioDestino: { nombre: 'Jefatura de Operaciones / Finanzas' },
            emailData: {
              asunto: `💰 AVISO: OT ${cierre.id_ot} cerrada sobre umbral ($${cierre.costo_total_ot.toLocaleString('es-CL')})`,
              titulo: `Cierre con Costo Alto: OT #${cierre.id_ot}`,
              cuerpoHtml: `<p>La orden de trabajo <strong>#${cierre.id_ot}</strong> ha sido cerrada superando el umbral de control presupuestario.</p><p><strong>Costo Total Liquidado:</strong> $${cierre.costo_total_ot.toLocaleString('es-CL')} CLP</p><p><strong>Estado Resultante del Activo:</strong> ${cierre.estado_equipo_resultante}</p>`
            },
            mensajeWsp: `💰 *AVISO COSTO TALLER GSP*\nOT #${cierre.id_ot} cerrada con costo de *$${cierre.costo_total_ot.toLocaleString('es-CL')} CLP* (Umbral superado).\nEstado activo: ${cierre.estado_equipo_resultante}.`,
            deepLinkData: { modulo: 'mantenimiento', accion: 'ver', id: cierre.id_ot }
          });
        } catch (notifErr) {
          console.warn('Advertencia: fallo despacho de notificación sobrecosto:', notifErr.message);
        }
      }

      return res.status(200).json({ success: true, message: 'Orden de trabajo cerrada exitosamente', data: cierre });
    } catch (err) {
      console.error('Error en MantenimientoController.cerrarOt:', err);
      return res.status(422).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 2. CHECKLIST / ACTIVIDADES
  // =========================================================================

  // POST /api/mantenimiento/ots/:id/actividades
  async agregarActividad(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!data.descripcion) {
        return res.status(400).json({ success: false, error: 'La descripción de la tarea es obligatoria.' });
      }
      const user = req.user || { id_empresa: 9 };
      const act = await mantenimientoModel.agregarActividad(id, data, user);
      return res.status(201).json({ success: true, data: act });
    } catch (err) {
      console.error('Error en MantenimientoController.agregarActividad:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/mantenimiento/actividades/:idActividad/estado
  async actualizarEstadoActividad(req, res) {
    try {
      const { idActividad } = req.params;
      const { estado, observacion_tecnico } = req.body;
      if (!estado) {
        return res.status(400).json({ success: false, error: 'El estado es obligatorio.' });
      }
      const act = await mantenimientoModel.actualizarEstadoActividad(idActividad, estado, observacion_tecnico);
      return res.status(200).json({ success: true, data: act });
    } catch (err) {
      console.error('Error en MantenimientoController.actualizarEstadoActividad:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/mantenimiento/actividades/:idActividad
  async eliminarActividad(req, res) {
    try {
      const { idActividad } = req.params;
      await mantenimientoModel.eliminarActividad(idActividad);
      return res.status(200).json({ success: true, message: 'Actividad eliminada' });
    } catch (err) {
      console.error('Error en MantenimientoController.eliminarActividad:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/mantenimiento/actividades/:idActividad/comentarios
  async agregarComentarioActividad(req, res) {
    try {
      const { idActividad } = req.params;
      const data = req.body;
      if (!data.texto && !data.comentario) {
        return res.status(400).json({ success: false, error: 'El texto del comentario es obligatorio.' });
      }
      const user = req.user || { id_user: 55, name_frst: 'Técnico', apellido_pat: 'Taller', id_empresa: 9 };
      const resultado = await mantenimientoModel.agregarComentarioActividad(idActividad, data, user);
      return res.status(201).json({ success: true, data: resultado });
    } catch (err) {
      console.error('Error en MantenimientoController.agregarComentarioActividad:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/mantenimiento/actividades/:idActividad/fotos
  async adjuntarFotoActividad(req, res) {
    try {
      const { idActividad } = req.params;
      const data = req.body;
      if (!data.url && !data.foto_url) {
        return res.status(400).json({ success: false, error: 'La URL de la foto es obligatoria.' });
      }
      const user = req.user || { id_user: 55, name_frst: 'Técnico', apellido_pat: 'Taller', id_empresa: 9 };
      const resultado = await mantenimientoModel.adjuntarFotoActividad(idActividad, data, user);
      return res.status(201).json({ success: true, data: resultado });
    } catch (err) {
      console.error('Error en MantenimientoController.adjuntarFotoActividad:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/mantenimiento/actividades/:idActividad/fotos/:idFoto
  async eliminarFotoActividad(req, res) {
    try {
      const { idActividad, idFoto } = req.params;
      const act = await mantenimientoModel.eliminarFotoActividad(idActividad, idFoto);
      return res.status(200).json({ success: true, message: 'Foto eliminada', data: act });
    } catch (err) {
      console.error('Error en MantenimientoController.eliminarFotoActividad:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 3. MATERIALES MANUALES (FASE 1)
  // =========================================================================

  // POST /api/mantenimiento/ots/:id/materiales
  async agregarMaterialManual(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!data.descripcion_material) {
        return res.status(400).json({ success: false, error: 'La descripción del material es obligatoria.' });
      }
      const user = req.user || { id_user: 55, id_empresa: 9 };
      const rep = await mantenimientoModel.agregarMaterialManual(id, data, user);
      return res.status(201).json({ success: true, data: rep });
    } catch (err) {
      console.error('Error en MantenimientoController.agregarMaterialManual:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/mantenimiento/materiales/:idRepuesto
  async eliminarMaterial(req, res) {
    try {
      const { idRepuesto } = req.params;
      await mantenimientoModel.eliminarMaterial(idRepuesto);
      return res.status(200).json({ success: true, message: 'Material eliminado' });
    } catch (err) {
      console.error('Error en MantenimientoController.eliminarMaterial:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 4. MANO DE OBRA HH
  // =========================================================================

  // POST /api/mantenimiento/ots/:id/hh
  async agregarHh(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!data.descripcion_trabajo) {
        return res.status(400).json({ success: false, error: 'La descripción del trabajo es obligatoria.' });
      }
      const user = req.user || { id_user: 55, id_empresa: 9 };
      const hh = await mantenimientoModel.agregarHh(id, data, user);
      return res.status(201).json({ success: true, data: hh });
    } catch (err) {
      console.error('Error en MantenimientoController.agregarHh:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/mantenimiento/hh/:idHh
  async eliminarHh(req, res) {
    try {
      const { idHh } = req.params;
      await mantenimientoModel.eliminarHh(idHh);
      return res.status(200).json({ success: true, message: 'Registro de HH eliminado' });
    } catch (err) {
      console.error('Error en MantenimientoController.eliminarHh:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 5. SERVICIOS EXTERNOS
  // =========================================================================

  // POST /api/mantenimiento/ots/:id/servicios-externos
  async agregarServicioExt(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!data.proveedor || !data.descripcion_servicio) {
        return res.status(400).json({ success: false, error: 'Proveedor y descripción del servicio son obligatorios.' });
      }
      const user = req.user || { id_user: 55, id_empresa: 9 };
      const srv = await mantenimientoModel.agregarServicioExt(id, data, user);
      return res.status(201).json({ success: true, data: srv });
    } catch (err) {
      console.error('Error en MantenimientoController.agregarServicioExt:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // DELETE /api/mantenimiento/servicios-externos/:idServicioExt
  async eliminarServicioExt(req, res) {
    try {
      const { idServicioExt } = req.params;
      await mantenimientoModel.eliminarServicioExt(idServicioExt);
      return res.status(200).json({ success: true, message: 'Servicio externo eliminado' });
    } catch (err) {
      console.error('Error en MantenimientoController.eliminarServicioExt:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 6. HALLAZGOS DURANTE LA MANTENCIÓN
  // =========================================================================

  // GET /api/mantenimiento/hallazgos
  async getHallazgos(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const filtros = {
        id_ot: req.query.id_ot,
        id_equipo: req.query.id_equipo,
        criticidad: req.query.criticidad,
        estado: req.query.estado
      };
      const hallazgos = await mantenimientoModel.getHallazgos(empresaId, filtros);
      return res.status(200).json({ success: true, count: hallazgos.length, data: hallazgos });
    } catch (err) {
      console.error('Error en MantenimientoController.getHallazgos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/mantenimiento/hallazgos
  async crearHallazgo(req, res) {
    try {
      const data = req.body;
      if (!data.id_equipo || !data.descripcion) {
        return res.status(400).json({ success: false, error: 'Equipo y descripción del hallazgo son obligatorios.' });
      }

      const user = req.user || { id_user: 55, id_empresa: 9 };
      const hallazgo = await mantenimientoModel.crearHallazgo(data, user);

      // Si es C1 (Crítico/Inseguro), despachar alerta de seguridad inmediata
      if (hallazgo.criticidad === 'C1') {
        try {
          await notificacionService.despacharNotificacion({
            evento: 'MNT_HALLAZGO_CRITICO_C1',
            usuarioDestino: { nombre: 'Jefe de Operaciones / Prevención' },
            emailData: {
              asunto: `🛑 PARADA DE SEGURIDAD: Hallazgo C1 en Equipo ${hallazgo.id_equipo}`,
              titulo: `Hallazgo Crítico Inseguro (C1)`,
              cuerpoHtml: `<p>Se ha registrado una condición de <strong>PARADA TÉCNICA INMEDIATA (C1)</strong> en el equipo ID <strong>${hallazgo.id_equipo}</strong>.</p><p><strong>Descripción:</strong> ${hallazgo.descripcion}</p><p>El activo ha sido bloqueado preventivamente en estado <strong>FUERA DE SERVICIO</strong>.</p>`
            },
            mensajeWsp: `🛑 *PARADA DE SEGURIDAD TALLER GSP* 🛑\nHallazgo Crítico *C1* detectado en Equipo ID *${hallazgo.id_equipo}*.\nDetalle: ${hallazgo.descripcion}.\nActivo puesto *FUERA DE SERVICIO*.`,
            deepLinkData: { modulo: 'mantenimiento', accion: 'hallazgos', id: hallazgo.id_hallazgo }
          });
        } catch (notifErr) {
          console.warn('Advertencia: fallo despacho de notificación hallazgo C1:', notifErr.message);
        }
      }

      return res.status(201).json({ success: true, message: 'Hallazgo registrado exitosamente', data: hallazgo });
    } catch (err) {
      console.error('Error en MantenimientoController.crearHallazgo:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/mantenimiento/hallazgos/:id
  async actualizarHallazgo(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const user = req.user || { id_user: 55, id_empresa: 9 };
      const actualizado = await mantenimientoModel.actualizarHallazgo(id, data, user);
      return res.status(200).json({ success: true, data: actualizado });
    } catch (err) {
      console.error('Error en MantenimientoController.actualizarHallazgo:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/mantenimiento/hallazgos/:id/resolver
  async resolverHallazgo(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      if (!data.decision) {
        return res.status(400).json({ success: false, error: 'La decisión técnica es obligatoria para resolver el hallazgo.' });
      }
      const user = req.user || { id_user: data.id_user_cierra || 55, id_empresa: 9 };
      const resuelto = await mantenimientoModel.resolverHallazgo(id, data, user);
      return res.status(200).json({ success: true, message: 'Hallazgo resuelto y cerrado exitosamente', data: resuelto });
    } catch (err) {
      console.error('Error en MantenimientoController.resolverHallazgo:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 7. AVISOS DE AVERÍA
  // =========================================================================

  // GET /api/mantenimiento/avisos
  async getAvisos(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const filtros = {
        estado: req.query.estado,
        id_equipo: req.query.id_equipo
      };
      const avisos = await mantenimientoModel.getAvisos(empresaId, filtros);
      return res.status(200).json({ success: true, count: avisos.length, data: avisos });
    } catch (err) {
      console.error('Error en MantenimientoController.getAvisos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // POST /api/mantenimiento/avisos
  async crearAviso(req, res) {
    try {
      const data = req.body;
      const descripcion = data.descripcion_sintoma || data.descripcion;
      if (!data.id_equipo || !descripcion) {
        return res.status(400).json({ success: false, error: 'Equipo y descripción del síntoma son obligatorios.' });
      }

      data.descripcion_sintoma = descripcion;
      data.descripcion = descripcion;

      const user = req.user || { id_user: 55, id_empresa: 9 };
      if (data.id_user) {
        user.id_user = Number(data.id_user);
      }
      const aviso = await mantenimientoModel.crearAviso(data, user);

      // Notificación urgente a Administradores si es PARADA_MAQUINA
      if (aviso.criticidad === 'PARADA_MAQUINA') {
        try {
          const pool = require('../config/postgresPool');
          const { rows: admins } = await pool.query(`
            SELECT DISTINCT u.id_user, u.name_frst, u.apellido_pat, u.email, u.movil AS phone 
            FROM tsec_users u
            LEFT JOIN tsec_user_roles ur ON u.id_user = ur.id_user
            LEFT JOIN tsec_roles r ON ur.id_rol = r.id_rol
            WHERE u.activo = true
              AND (
                r.name_rol ILIKE '%Admin%' 
                OR r.name_rol ILIKE '%GSP_ADMIN%' 
                OR r.name_rol ILIKE '%OPERACIONES%'
                OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Director%'
                OR COALESCE(u.json_data->>'cargo', '') ILIKE '%Jefe%'
              )
          `);
          const { rows: eqRows } = await pool.query(
            'SELECT patente, modelo FROM tequ_equipo WHERE id_equipo = $1',
            [aviso.id_equipo]
          );
          const eq = eqRows[0] || { patente: 'S/P', modelo: 'Grúa' };

          // Resolver nombre real del reportante
          let reporterName = (user.name_frst ? `${user.name_frst} ${user.apellido_pat || ''}` : '').trim();
          if (!reporterName && aviso.id_user_reporta) {
            const { rows: uRows } = await pool.query(
              'SELECT name_frst, apellido_pat FROM tsec_users WHERE id_user = $1',
              [aviso.id_user_reporta]
            );
            if (uRows.length > 0) {
              reporterName = `${uRows[0].name_frst || ''} ${uRows[0].apellido_pat || ''}`.trim();
            }
          }
          if (!reporterName && data.nombre_usuario) {
            reporterName = data.nombre_usuario;
          }
          if (!reporterName) reporterName = 'Operador/Técnico en Terreno';

          const cantFotos = (aviso.fotos && Array.isArray(aviso.fotos)) ? aviso.fotos.length : 0;
          const fotosTxtWsp = cantFotos > 0 ? `\n📸 *Fotos adjuntas:* ${cantFotos} fotografía(s)` : '';
          const fotosHtmlEmail = cantFotos > 0 ? `<p><strong>Evidencias Fotográficas:</strong> ${cantFotos} fotografía(s) adjunta(s).</p>` : '';

          for (const adm of admins) {
            await notificacionService.despacharNotificacion({
              evento: 'MNT_PARADA_MAQUINA',
              canales: ['EMAIL', 'WHATSAPP'],
              destinatario: { nombre: `${adm.name_frst || ''} ${adm.apellido_pat || ''}`.trim(), email: adm.email, telefono: adm.phone },
              deepLink: { tipoApp: 'WEB', ruta: 'mantenimiento', params: { tab: 'avisos', folio: aviso.folio_aviso } },
              emailData: {
                asunto: `🚨 ALERTA PARADA DE MÁQUINA: Grúa ${eq.patente} Inmovilizada`,
                titulo: `Aviso Crítico: Parada de Máquina (${aviso.folio_aviso})`,
                subtitulo: `Grúa ${eq.patente} fuera de servicio`,
                contenido: `<p>Se ha reportado una detención no programada del activo <strong>${eq.patente} (${eq.modelo})</strong>.</p><p><strong>Síntoma / Falla:</strong> ${aviso.descripcion}</p><p><strong>Folio Aviso:</strong> ${aviso.folio_aviso}</p><p><strong>Reportado por:</strong> ${reporterName}</p>${fotosHtmlEmail}`,
                botonTexto: 'VER EN CONSOLA WEB'
              },
              wspData: {
                mensaje: `🚨 *ALERTA TALLER GSP — PARADA DE MÁQUINA* 🚨\n\nEl activo *${eq.patente} (${eq.modelo})* se encuentra *INMOVILIZADO*.\n📋 *Folio Aviso:* ${aviso.folio_aviso}\n⚠️ *Falla:* ${aviso.descripcion}\n👤 *Reportado por:* ${reporterName}${fotosTxtWsp}`
              }
            });
          }
        } catch (notifAdmErr) {
          console.warn('Advertencia: fallo notificación de parada de máquina a admins:', notifAdmErr.message);
        }
      }

      return res.status(201).json({ success: true, message: 'Aviso de mantenimiento ingresado', data: aviso });
    } catch (err) {
      console.error('Error en MantenimientoController.crearAviso:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 8. PAUTAS DE MANTENIMIENTO PREVENTIVO
  // =========================================================================

  // GET /api/mantenimiento/pautas
  async getPautas(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const pautas = await mantenimientoModel.getPautas(empresaId);
      return res.status(200).json({ success: true, data: pautas });
    } catch (err) {
      console.error('Error en MantenimientoController.getPautas:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 9. RADAR DE FLOTA & HORÓMETROS
  // =========================================================================

  // GET /api/mantenimiento/flota/radar
  async getRadarFlota(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const radar = await mantenimientoModel.getRadarFlota(empresaId);
      return res.status(200).json({ success: true, count: radar.length, data: radar });
    } catch (err) {
      console.error('Error en MantenimientoController.getRadarFlota:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 10. HOJA DE VIDA DEL ACTIVO (PASAPORTE 360°)
  // =========================================================================

  // GET /api/mantenimiento/equipo/:id/hoja-vida
  async getHojaVidaEquipo(req, res) {
    try {
      const { id } = req.params;
      const empresaId = this._getEmpresaId(req);
      const hoja = await mantenimientoModel.getHojaVidaEquipo(id, empresaId);

      if (!hoja) {
        return res.status(404).json({ success: false, error: 'Equipo no encontrado' });
      }

      return res.status(200).json({ success: true, data: hoja });
    } catch (err) {
      console.error('Error en MantenimientoController.getHojaVidaEquipo:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 11. DASHBOARD DE INDICADORES ENTERPRISE (KPIS)
  // =========================================================================

  // GET /api/mantenimiento/kpis
  async getKpis(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const kpis = await mantenimientoModel.getKpis(empresaId);
      return res.status(200).json({ success: true, data: kpis });
    } catch (err) {
      console.error('Error en MantenimientoController.getKpis:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 12. PARÁMETROS OPERACIONALES
  // =========================================================================

  // GET /api/mantenimiento/parametros
  async getParametros(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const params = await mantenimientoModel.getParametros(empresaId);
      return res.status(200).json({ success: true, data: params });
    } catch (err) {
      console.error('Error en MantenimientoController.getParametros:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // PUT /api/mantenimiento/parametros
  async actualizarParametro(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const { clave, valor, parametros } = req.body;

      if (parametros && typeof parametros === 'object') {
        const resultados = {};
        for (const [k, v] of Object.entries(parametros)) {
          const act = await mantenimientoModel.actualizarParametro(empresaId, k, v);
          resultados[k] = act.valor;
        }
        return res.status(200).json({ success: true, count: Object.keys(resultados).length, data: resultados });
      }

      if (!clave || valor === undefined) {
        return res.status(400).json({ success: false, error: 'Clave y valor son requeridos.' });
      }
      const actualizado = await mantenimientoModel.actualizarParametro(empresaId, clave, valor);
      return res.status(200).json({ success: true, data: actualizado });
    } catch (err) {
      console.error('Error en MantenimientoController.actualizarParametro:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // =========================================================================
  // 13. TÉCNICOS Y MECÁNICOS
  // =========================================================================

  // GET /api/mantenimiento/tecnicos
  async getTecnicos(req, res) {
    try {
      const empresaId = this._getEmpresaId(req);
      const tecnicos = await mantenimientoModel.getTecnicos(empresaId);
      return res.status(200).json({ success: true, count: tecnicos.length, data: tecnicos });
    } catch (err) {
      console.error('Error en MantenimientoController.getTecnicos:', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new MantenimientoController();
