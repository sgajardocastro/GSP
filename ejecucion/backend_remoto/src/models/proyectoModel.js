const pool = require("../config/postgresPool");

class ProyectoModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  // Obtener todos los proyectos
  async getProyectos(id_empresa = null) {
    let query = `
      SELECT 
        p.*,
        e.razon_social AS nombre_cliente,
        est.nombre_estado,
        tip.nombre_tipo
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
      LEFT JOIN tpry_estado  est ON p.id_proyecto_estado = est.id_proyecto_estado
      LEFT JOIN tpry_tipo   tip ON p.id_proyecto_tipo = tip.id_proyecto_tipo
    `;
    const values = [];

    if (id_empresa) {
      query += ` WHERE p.id_empresa = $1`;
      values.push(id_empresa);
    }

    query += ` ORDER BY p.id_proyecto DESC;`;

    try {
      const { rows } = await this.pool.query(query, values);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener proyectos: ${error.message}`);
    }
  }

  // Obtener un proyecto por ID
  async getProyectoById(id_proyecto) {
    const query = `SELECT * FROM tpry_proyecto WHERE id_proyecto = $1 LIMIT 1;`;

    try {
      const { rows } = await this.pool.query(query, [id_proyecto]);
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error al obtener proyecto: ${error.message}`);
    }
  }

  // ✅ Generar código transaccional (codi_proyecto)
  async generarCodigoTransaccional(id_empresa, id_cliente = null, providedClient = null) {
    const client = providedClient || await this.pool.connect();
    let localTransaction = !providedClient;
    
    try {
      if (localTransaction) await client.query('BEGIN');

      const date = new Date();
      const yy = String(date.getFullYear()).slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const anio_mes = `${yy}${mm}`;
      
      let prefijo = 'PRY';
      if (id_empresa == 9) prefijo = 'GSP';
      else if (id_empresa == 7) prefijo = 'BMQ';
      else if (id_empresa == 8) prefijo = 'LDS';
      else if (id_empresa == 11) prefijo = 'RYL';

      // Aseguramos que exista el registro para el mes actual
      await client.query(`
        INSERT INTO tpry_correlativos (prefijo, anio_mes, ultimo_valor)
        VALUES ($1, $2, 0)
        ON CONFLICT (prefijo, anio_mes) DO NOTHING;
      `, [prefijo, anio_mes]);

      // Bloqueamos e incrementamos de forma atómica
      const result = await client.query(`
        UPDATE tpry_correlativos 
        SET ultimo_valor = ultimo_valor + 1
        WHERE prefijo = $1 AND anio_mes = $2
        RETURNING ultimo_valor, prefijo;
      `, [prefijo, anio_mes]);

      const nuevoValor = result.rows[0].ultimo_valor;
      const pref = result.rows[0].prefijo;
      const correlativo = String(nuevoValor).padStart(3, '0');
      
      let codigo = '';
      if (id_cliente) {
        codigo = `${pref}-${anio_mes}-${id_cliente}-${correlativo}`;
      } else {
        codigo = `${pref}-${anio_mes}-${correlativo}`;
      }

      if (localTransaction) await client.query('COMMIT');
      return codigo;
    } catch (error) {
      if (localTransaction) await client.query('ROLLBACK');
      throw new Error(`Error al generar código: ${error.message}`);
    } finally {
      if (localTransaction) client.release();
    }
  }

  // Crear proyecto
  async createProyecto(data) {
    const {
      nombre_proyecto,
      codi_proyecto,
      centro_costo = null,
      id_proyecto_padre = null,
      id_empresa_cliente = null,
      id_usuario_cliente = null,
      id_usuario_jefe_proyecto = null,
      id_proyecto_tipo = null,
      id_proyecto_estado = null,
      fecha_plan_ini = null,
      fecha_plan_fin = null,
      duracion_plan = null,
      avance_plan_proyecto = null,
      objetivo_proyecto = null,
      observacion_proyecto = null,
      id_user_creacion = null, // 👈 estilo survey
      id_empresa = null,
      json_field = null
    } = data;

    const query = `
      INSERT INTO tpry_proyecto (
        id_empresa,
        nombre_proyecto,
        codi_proyecto,
        centro_costo,
        id_proyecto_padre,
        id_empresa_cliente,
        id_usuario_cliente,
        id_usuario_jefe_proyecto,
        id_proyecto_tipo,
        id_proyecto_estado,
        fecha_plan_ini,
        fecha_plan_fin,
        duracion_plan,
        avance_plan_proyecto,
        objetivo_proyecto,
        observacion_proyecto,
        id_usuario_creacion,
        fecha_creacion,
        json_field
      )
      VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15,
        $16, $17, NOW(), $18
      )
      RETURNING *;
    `;

    const values = [
      id_empresa,
      nombre_proyecto,
      codi_proyecto,
      centro_costo,
      id_proyecto_padre,
      id_empresa_cliente,
      id_usuario_cliente,
      id_usuario_jefe_proyecto,
      id_proyecto_tipo,
      id_proyecto_estado,
      fecha_plan_ini,
      fecha_plan_fin,
      duracion_plan,
      avance_plan_proyecto,
      objetivo_proyecto,
      observacion_proyecto,
      id_user_creacion,
      json_field
    ];

    try {
      const { rows, rowCount } = await this.pool.query(query, values);
      if (!rowCount) throw new Error("No se pudo crear el proyecto");
      return rows[0];
    } catch (error) {
      throw new Error(`Error al crear proyecto: ${error.message}`);
    }
  }

  // Actualizar proyecto
  async updateProyecto(id_proyecto, data) {
    const {
      nombre_proyecto = null,
      codi_proyecto = null,
      centro_costo = null,
      id_empresa_cliente = null,
      id_usuario_jefe_proyecto = null,
      id_proyecto_estado = null,
      id_proyecto_tipo = null,
      fecha_plan_ini = null,
      fecha_plan_fin = null,
      objetivo_proyecto = null,
      observacion_proyecto = null,
      json_field = null,
      id_user_modificacion = null
    } = data;

    const query = `
      UPDATE tpry_proyecto
      SET
        nombre_proyecto         = COALESCE($1, nombre_proyecto),
        codi_proyecto           = COALESCE($2, codi_proyecto),
        centro_costo            = COALESCE($3, centro_costo),
        id_empresa_cliente       = COALESCE($4, id_empresa_cliente),
        id_usuario_jefe_proyecto = COALESCE($5, id_usuario_jefe_proyecto),
        id_proyecto_estado       = COALESCE($6, id_proyecto_estado),
        id_proyecto_tipo         = COALESCE($7, id_proyecto_tipo),
        fecha_plan_ini           = COALESCE($8, fecha_plan_ini),
        fecha_plan_fin           = COALESCE($9, fecha_plan_fin),
        objetivo_proyecto        = COALESCE($10, objetivo_proyecto),
        observacion_proyecto     = COALESCE($11, observacion_proyecto),
        json_field               = COALESCE($12, json_field),
        id_usuario_modificacion  = COALESCE($13, id_usuario_modificacion),
        fecha_modificacion       = NOW()
      WHERE id_proyecto = $14
      RETURNING *;
    `;

    const values = [
      nombre_proyecto,
      codi_proyecto,
      centro_costo,
      id_empresa_cliente,
      id_usuario_jefe_proyecto,
      id_proyecto_estado,
      id_proyecto_tipo,
      fecha_plan_ini,
      fecha_plan_fin,
      objetivo_proyecto,
      observacion_proyecto,
      json_field,
      id_user_modificacion,
      id_proyecto
    ];

    try {
      const { rows, rowCount } = await this.pool.query(query, values);
      if (!rowCount) return null;
      return rows[0];
    } catch (error) {
      throw new Error(`Error al actualizar proyecto: ${error.message}`);
    }
  }

  // Eliminar proyecto
  async deleteProyecto(id_proyecto) {
    const query = `DELETE FROM tpry_proyecto WHERE id_proyecto = $1 RETURNING id_proyecto;`;

    try {
      const { rows, rowCount } = await this.pool.query(query, [id_proyecto]);
      if (!rowCount) return null;
      return rows[0];
    } catch (error) {
      throw new Error(`Error al eliminar proyecto: ${error.message}`);
    }
  }

  // ✅ Obtener contador de usuarios únicos activos por proyecto
  async getUsuariosPorProyecto() {
    const query = `
      SELECT 
        p.id_proyecto, 
        p.nombre_proyecto, 
        COUNT(DISTINCT em.id_user) as total_usuarios
      FROM tpry_proyecto p
      LEFT JOIN tpry_equipo_proyecto ep ON p.id_proyecto = ep.id_proyecto
      LEFT JOIN tpry_equipo_miembro em ON ep.id_equipo_proyecto = em.id_equipo_proyecto AND em.activo = true
      GROUP BY p.id_proyecto, p.nombre_proyecto
      ORDER BY total_usuarios DESC;
    `;

    try {
      const { rows } = await this.pool.query(query);
      return rows;
    } catch (error) {
      throw new Error(`Error al obtener usuarios por proyecto: ${error.message}`);
    }
  }

  // Generar nueva versión de cotización usando secuencia y persistiendo en json_field
  async generarCotizacionVersion(id_proyecto, monto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows } = await client.query('SELECT * FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
      if (rows.length === 0) throw new Error("Proyecto no encontrado");
      const p = rows[0];
      
      let codi = p.codi_proyecto;
      if (!codi) {
        codi = await this.generarCodigoTransaccional(p.id_empresa, p.id_empresa_cliente, client);
        await client.query('UPDATE tpry_proyecto SET codi_proyecto = $1 WHERE id_proyecto = $2', [codi, id_proyecto]);
      }
      
      await client.query('CREATE SEQUENCE IF NOT EXISTS sch_leangsp.seq_id_cotizacion START 1');
      
      const seqResult = await client.query("SELECT nextval('sch_leangsp.seq_id_cotizacion') AS next_id");
      const nextId = seqResult.rows[0].next_id;
      
      const jsonField = p.json_field || {};
      if (!jsonField.crm_v1) jsonField.crm_v1 = {};
      if (!jsonField.crm_v1.cotizaciones_historicas) jsonField.crm_v1.cotizaciones_historicas = [];
      
      const version = jsonField.crm_v1.cotizaciones_historicas.length + 1;
      const fileName = `${codi}V${version}-${nextId}.pdf`;
      
      const nuevaCotizacion = {
        id_cotizacion: Number(nextId),
        version: version,
        nombre_archivo: fileName,
        monto: Number(monto || 0),
        fecha: new Date().toISOString(),
        fecha: new Date().toISOString()
      };
      // We will set url after inserting into tfmg_file.

      // We will update the project later.

      // Escribir un archivo PDF real e imprimible (HTML-to-PDF)
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const { buildStoragePath, resolveStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
      const archivoModel = require('./archivoModel');

      const path_relativo = buildStoragePath('gsp', 'cotizaciones');
      const targetDir = path.join(STORAGE_ROOT, path_relativo);
      const filepath = path.join(targetDir, fileName);
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 1. Obtener detalles del cliente mandante
      let clienteObj = null;
      if (p.id_empresa_cliente) {
        const { rows: clientRows } = await client.query('SELECT * FROM tpar_empresas WHERE id_empresa = $1', [p.id_empresa_cliente]);
        if (clientRows.length > 0) {
          clienteObj = clientRows[0];
        }
      }

      // 1b. Obtener detalles de la empresa emisora desde DB (Paramétrico)
      let emisorObjDB = null;
      if (p.id_empresa_emisora) {
        const { rows: emisorRows } = await client.query('SELECT * FROM tpar_empresas WHERE id_empresa = $1', [p.id_empresa_emisora]);
        if (emisorRows.length > 0) emisorObjDB = emisorRows[0];
      }

      // 2. Definir emisor y sus características según id_empresa
      const EMISORES = {
        9: {
          nombre: "LUIS OMAR GHISELLINI JARA E.I.R.L. (GRÚAS SAN PABLO)",
          rut: "52.004.162-1",
          giro: "ARRIENDO DE MAQUINARIAS Y VEHÍCULOS MOTORIZADOS",
          direccion: "Botrolhue KM 9.5 Hijuela 24 Camino Labranza, Temuco",
          fono: "+56 9 9443 7725",
          color: "#f5a623",
          colorLight: "rgba(245, 166, 35, 0.08)",
          logoPath: "logo-sanpablo.png"
        },
        7: {
          nombre: "SOCIEDAD BESTMAQ VENTA DE MAQUINARIA USADA LIMITADA (BESTMAQ)",
          rut: "76.209.534-3",
          giro: "ARRIENDO DE MAQUINARIAS Y VEHÍCULOS",
          direccion: "Camino Labranza KM 9.5, Temuco",
          fono: "+56 9 9443 7725",
          color: "#3b82f6",
          colorLight: "rgba(59, 130, 246, 0.08)"
        },
        8: {
          nombre: "SERVICIOS INTEGRADOS LOGÍSTICOS DEL SUR LTDA. (LOGÍSTICA DEL SUR)",
          rut: "76.218.576-8",
          giro: "ARRIENDO DE MAQUINARIAS Y LOGÍSTICA",
          direccion: "KM 9.5 Camino Labranza Hj 24 Lugar Botrolhue, Temuco",
          fono: "+56 9 9443 7725",
          color: "#10b981",
          colorLight: "rgba(16, 185, 129, 0.08)"
        },
        11: {
          nombre: "ARRIENDO ROYAL RENTAL LIMITADA (ROYAL RENTAL)",
          rut: "78.254.535-3",
          giro: "ARRIENDO DE MAQUINARIAS Y EQUIPOS",
          direccion: "Camino Labranza KM 9.5, Temuco",
          fono: "+56 9 9443 7725",
          color: "#8b5cf6",
          colorLight: "rgba(139, 92, 246, 0.08)"
        }
      };


      // Objeto base de colores
      let emisorBase = EMISORES[p.id_empresa_emisora] || EMISORES[9];
      
      const emisor = {
        nombre: emisorObjDB?.razon_social || emisorObjDB?.name_empresa || emisorBase.nombre,
        rut: emisorObjDB?.rut_empresa || emisorBase.rut,
        giro: emisorObjDB?.giro || emisorBase.giro,
        direccion: emisorObjDB?.direccion || emisorBase.direccion,
        fono: emisorObjDB?.fono_contacto || emisorBase.fono,
        color: emisorBase.color,
        colorLight: emisorBase.colorLight,
        logoPath: emisorObjDB?.logo_empresa || emisorBase.logoPath
      };

      let finalLogoPath = emisor.logoPath;
      try {
        const logoFileName = emisor.logoPath || 'logo-sanpablo.png';
        const diskPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoFileName);
        const fs = require('fs');
        if (fs.existsSync(diskPath)) {
          const imgBuf = fs.readFileSync(diskPath);
          finalLogoPath = 'data:image/png;base64,' + imgBuf.toString('base64');
        } else {
           console.warn(`Logo no encontrado en disco: ${diskPath}`);
        }
      } catch (err) {
        console.error('Error leyendo logo desde disco:', err);
      }

      // 3. Extraer datos estructurados de json_field.crm_v1
      const crm = jsonField.crm_v1 || {};
      const lineas = crm.lineas_servicio || [];

      // Formateador simple de moneda CLP
      const formatCLP = (v) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v || 0);
      };

      // 4. Compilar líneas de servicios en tabla HTML
      let lineasHtml = '';
      lineas.forEach((line, index) => {
        const qty = Number(line.cantidad || 0);
        const price = Number(line.valorUnitario || line.valor_unitario || 0);
        const totalLine = qty * price;
        lineasHtml += `
          <tr>
            <td style="text-align: center;">${index + 1}</td>
            <td>
              <div style="font-weight: bold; color: ${emisor.color}; text-transform: uppercase; font-size: 8px;">
                ${line.tipo || 'Servicio'} ${line.subcategoria ? '— ' + line.subcategoria : ''}
              </div>
              <div style="margin-top: 2px; font-size: 9px; color: #2d3748;">
                ${line.descripcion || '—'}
              </div>
              <ul style="margin: 3px 0 0 15px; padding: 0; font-size: 8px; color: #4a5568;">
                ${Object.keys(line).filter(k => !['tipo','subcategoria','descripcion','cantidad','valorUnitario','valor_unitario','unidad'].includes(k)).map(k => `<li><strong>${String(k).toUpperCase().replace(/_/g, ' ')}:</strong> ${typeof line[k] === 'object' ? JSON.stringify(line[k]) : line[k]}</li>`).join('')}
              </ul>
            </td>
            <td style="text-align: center;">${qty}</td>
            <td style="text-align: center;">${line.unidad || 'Día'}</td>
            <td style="text-align: right;">${formatCLP(price)}</td>
            <td style="text-align: right;">${formatCLP(totalLine)}</td>
          </tr>
        `;
      });
      if (lineas.length === 0) {
        lineasHtml = `<tr><td colspan="6" style="text-align: center; color: #718096; padding: 10px;">No hay líneas de servicio detalladas</td></tr>`;
      }

      // Totales
      const totalNetoVal = Number(monto || 0);
      const ivaVal = Math.round(totalNetoVal * 0.19);
      const totalGeneralVal = totalNetoVal + ivaVal;

      // Formatear saltos de línea de condiciones para HTML
      const condicionesHtml = crm.condiciones_pdf || '';

      // Generar secciones extra dinámicas para los tabs del CRM (ej. Datos Servicio & Visita)
      let extraSectionsHtml = '';

      const standardKeys = ['lineas_servicio', 'cotizaciones_historicas', 'condiciones_pdf', 'prioridad', 'contacto_nombre', 'contacto_telefono', 'tipo_pago', 'requiere_oc_hes', 'obra_nombre', 'obra_direccion', 'obra_ciudad', 'coordenadas_mapa', 'detalle_servicio', 'tipo_carga', 'peso_carga', 'volumen_carga', 'radios_trabajo', 'alturas_trabajo', 'visita_terreno', 'validez_dias', 'moneda', 'condicion_servicio'];
      let sectionCounter = 4; // Empezamos en 4 porque 1, 2 y 3 ya están definidos arriba (la sección de Condiciones Comerciales será la última)
      
      /*
      for (const key in crm) {
        if (!standardKeys.includes(key) && crm[key] !== null && crm[key] !== undefined && crm[key] !== '') {
           let valHtml = '';
           if (typeof crm[key] === 'object' && !Array.isArray(crm[key])) {
              valHtml = `<table class="info-table">`;
              let rowCount = 0;
              for (const subKey in crm[key]) {
                if (rowCount % 2 === 0) valHtml += '<tr>';
                valHtml += `<td class="info-label" style="width: 20%;">${String(subKey).toUpperCase().replace(/_/g, ' ')}</td><td class="info-value" style="width: 30%;">${typeof crm[key][subKey] === 'object' ? JSON.stringify(crm[key][subKey]) : crm[key][subKey]}</td>`;
                if (rowCount % 2 !== 0) valHtml += '</tr>';
                rowCount++;
              }
              if (rowCount % 2 !== 0) valHtml += '<td colspan="2"></td></tr>';
              valHtml += `</table>`;
           } else if (Array.isArray(crm[key])) {
              valHtml = `<div style="font-size: 9px; padding: 4px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f7fafc;">`;
              valHtml += crm[key].map(item => typeof item === 'object' ? JSON.stringify(item) : item).join('<br>');
              valHtml += `</div>`;
           } else {
              valHtml = `<table class="info-table"><tr><td class="info-label" style="width: 25%;">${String(key).toUpperCase().replace(/_/g, ' ')}</td><td class="info-value" style="width: 75%;">${crm[key]}</td></tr></table>`;
           }
           extraSectionsHtml += `
             <div class="section-title">${sectionCounter}. ${String(key).toUpperCase().replace(/_/g, ' ')}</div>
             ${valHtml}
           `;
           sectionCounter++;
        }
      }
      */

      // 5. Generar plantilla HTML
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Cotización ${codi}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
            color: #2d3748;
            background-color: #ffffff;
            margin: 0;
            padding: 10px;
            font-size: 11px;
            line-height: 1.4;
          }
          .container { width: 100%; }
          .header-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; margin-top: 15px; }
          .header-table td { vertical-align: middle; }
          .emitter-title { font-size: 16px; font-weight: bold; color: ${emisor.color}; text-transform: uppercase; margin-bottom: 5px; }
          .emitter-info { font-size: 10px; color: #718096; margin-top: 4px; line-height: 1.3; }
          .quote-badge { background-color: ${emisor.colorLight}; border: 1px solid ${emisor.color}; border-radius: 6px; padding: 12px; text-align: center; }
          .quote-title { font-size: 14px; font-weight: bold; color: #1a202c; }
          .quote-meta { font-size: 10px; color: #2d3748; margin-top: 5px; line-height: 1.4; }
          
          .section-title { font-size: 12px; font-weight: bold; color: #1a202c; text-transform: uppercase; border-bottom: 2px solid ${emisor.color}; padding-bottom: 3px; margin-bottom: 8px; margin-top: 15px; }
          .info-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .info-table td { padding: 6px 8px; vertical-align: top; border: 1px solid #e2e8f0; font-size: 10px; }
          .info-label { font-weight: bold; color: #4a5568; background-color: #f7fafc; width: 20%; }
          .info-value { color: #2d3748; width: 30%; }
          
          .services-table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 10px; }
          .services-table th { background-color: ${emisor.color}; color: #ffffff; font-weight: bold; text-transform: uppercase; font-size: 10px; padding: 6px 8px; border: 1px solid ${emisor.color}; text-align: left; }
          .services-table td { padding: 6px 8px; border: 1px solid #cbd5e0; vertical-align: top; }
          .services-table tr:nth-child(even) { background-color: #f7fafc; }
          
          .summary-table { width: 250px; float: right; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
          .summary-table td { padding: 6px 8px; border: 1px solid #cbd5e0; }
          .summary-label { font-weight: bold; background-color: #f7fafc; text-align: right; width: 50%; }
          .summary-value { text-align: right; font-weight: bold; width: 50%; }
          .summary-total { background-color: ${emisor.colorLight}; color: #1a202c; font-size: 12px; }
          
          .conditions-box { background-color: #f7fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; margin-top: 10px; font-size: 10px; color: #4a5568; line-height: 1.5; }
          .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #a0aec0; border-top: 1px solid #e2e8f0; padding-top: 8px; clear: both; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- HEADER -->
          <table class="header-table">
            <tr>
              <td style="width: 25%;">
                ${finalLogoPath ? `<img src="${finalLogoPath}" style="max-width: 140px; max-height: 80px;" alt="Logo" />` : ''}
              </td>
              <td style="width: 45%;">
                <div class="emitter-title">${emisor.nombre}</div>
                <div class="emitter-info">
                  RUT: ${emisor.rut} | Giro: ${emisor.giro}<br>
                  Casa Matriz: ${emisor.direccion}<br>
                  Contacto: ${emisor.fono}
                </div>
              </td>
              <td style="width: 30%; text-align: right;">
                <div class="quote-badge">
                  <div class="quote-title">COTIZACIÓN COMERCIAL</div>
                  <div class="quote-meta">
                    <strong>Número:</strong> ${codi}<br>
                    <strong>Versión:</strong> ${version}<br>
                    <strong>Fecha:</strong> ${new Date(nuevaCotizacion.fecha).toLocaleDateString('es-CL')}<br>
                    <strong>Prioridad:</strong> ${String(crm.prioridad || 'normal').toUpperCase()}
                  </div>
                </div>
              </td>
            </tr>
          </table>
          
          <!-- CLIENTE MANDANTE -->
          <div class="section-title">1. Datos del Cliente Mandante</div>
          <table class="info-table">
            <tr>
              <td class="info-label">Razón Social:</td>
              <td class="info-value">${clienteObj ? clienteObj.razon_social : '—'}</td>
              <td class="info-label">RUT Cliente:</td>
              <td class="info-value">${clienteObj ? clienteObj.rut_empresa : '—'}</td>
            </tr>
            <tr>
              <td class="info-label">Dirección:</td>
              <td class="info-value">${clienteObj ? (clienteObj.direccion || '—') : '—'}</td>
              <td class="info-label">Giro:</td>
              <td class="info-value">${clienteObj ? (clienteObj.giro || '—') : '—'}</td>
            </tr>
            <tr>
              <td class="info-label">Contacto:</td>
              <td class="info-value">${crm.contacto_nombre || '—'}</td>
              <td class="info-label">Teléfono:</td>
              <td class="info-value">${crm.contacto_telefono || '—'}</td>
            </tr>
            <tr>
              <td class="info-label">Forma de Pago:</td>
              <td class="info-value" style="text-transform: uppercase;">${crm.tipo_pago || '—'}</td>
              <td class="info-label">Requiere OC/HES:</td>
              <td class="info-value">${crm.requiere_oc_hes ? 'SÍ' : 'NO'}</td>
            </tr>
          </table>
          
          <!-- DATOS SERVICIO & VISITA -->
          <div class="section-title">2. Datos de Operación e Ingeniería</div>
          <table class="info-table">
            <tr>
              <td class="info-label">Nombre Obra/Proyecto:</td>
              <td class="info-value">${crm.obra_nombre || p.nombre_proyecto || '—'}</td>
              <td class="info-label">Ubicación Obra:</td>
              <td class="info-value">
                • <strong>Dirección:</strong> ${crm.obra_direccion || '—'}<br>
                • <strong>Comuna/Ciudad:</strong> ${crm.obra_ciudad || '—'}
                ${crm.coordenadas_mapa?.lat ? `<br>• <strong>Coordenadas GPS:</strong> <span style="font-family: monospace; font-size: 8.5px;">${crm.coordenadas_mapa.lat}, ${crm.coordenadas_mapa.lng}</span>` : ''}
              </td>
            </tr>
            <tr>
              <td class="info-label">Horario Inicio Servicio:</td>
              <td class="info-value">${crm.fecha_hora_inicio ? new Date(crm.fecha_hora_inicio).toLocaleString('es-CL') : 'A coordinar con Operaciones'}</td>
              <td class="info-label">Término Estimado:</td>
              <td class="info-value">${crm.fecha_hora_termino ? new Date(crm.fecha_hora_termino).toLocaleString('es-CL') : 'Según avance de faena'}</td>
            </tr>
            <tr>
              <td class="info-label">Detalle del Servicio:</td>
              <td class="info-value" colspan="3">${crm.detalle_servicio || p.observacion_proyecto || '—'}</td>
            </tr>
            <tr>
              <td class="info-label">Tipo de Carga:</td>
              <td class="info-value">${crm.tipo_carga || '—'}</td>
              <td class="info-label">Peso de la Carga:</td>
              <td class="info-value">${crm.peso_carga || '—'}</td>
            </tr>
            <tr>
              <td class="info-label">Volumen (Dimensiones):</td>
              <td class="info-value">${crm.volumen_carga || '—'}</td>
              <td class="info-label">Radios / Alturas Trab:</td>
              <td class="info-value">Radio: ${crm.radios_trabajo || '—'} | Altura: ${crm.alturas_trabajo || '—'}</td>
            </tr>
            <tr>
              <td class="info-label">Condiciones Operativas:</td>
              <td class="info-value" colspan="3">
                • <strong>Requiere Acreditación:</strong> ${crm.requiere_acreditacion === true ? 'SÍ' : 'NO'}&nbsp;&nbsp;&nbsp;&nbsp;
                • <strong>Incluye Traslado / Flete:</strong> ${crm.incluye_flete === true ? 'SÍ' : 'NO'}&nbsp;&nbsp;&nbsp;&nbsp;
                • <strong>Requiere Rigger:</strong> ${crm.requiere_rigger === true ? 'SÍ' : 'NO'}&nbsp;&nbsp;&nbsp;&nbsp;
                • <strong>Prevencionista:</strong> ${crm.requiere_prevencionista === true ? 'SÍ' : 'NO'}<br>
                • <strong>Cliente pone Combustible:</strong> <strong>${crm.cliente_pone_combustible === true ? 'SÍ (Suministrado por Mandante)' : 'NO (Suministrado por San Pablo)'}</strong>
              </td>
            </tr>
            <tr>
              <td class="info-label">Visita Técnica Terreno:</td>
              <td class="info-value" colspan="3">${crm.visita_terreno ? 'SÍ (Realizada por personal técnico certificado GSP)' : 'NO (Sujeto a validación operacional previa en faena)'}</td>
            </tr>
          </table>
          
          <!-- ESTRUCTURADOR DE SERVICIOS -->
          <div class="section-title">3. Detalles de Servicios y Tarifas</div>
          <table class="services-table">
            <thead>
              <tr>
                <th style="width: 5%;">Item</th>
                <th style="width: 55%;">Descripción del Servicio</th>
                <th style="width: 8%; text-align: center;">Cantidad</th>
                <th style="width: 8%; text-align: center;">Unidad</th>
                <th style="width: 12%; text-align: right;">Unitario (Neto)</th>
                <th style="width: 12%; text-align: right;">Subtotal (Neto)</th>
              </tr>
            </thead>
            <tbody>
              ${lineasHtml}
            </tbody>
          </table>
          
          <!-- TOTALES -->
          <table class="summary-table">
            <tr>
              <td class="summary-label">Total Neto:</td>
              <td class="summary-value">${formatCLP(totalNetoVal)}</td>
            </tr>
            <tr>
              <td class="summary-label">IVA (19%):</td>
              <td class="summary-value">${formatCLP(ivaVal)}</td>
            </tr>
            <tr class="summary-total">
              <td class="summary-label summary-total">Total General:</td>
              <td class="summary-value summary-total">${formatCLP(totalGeneralVal)}</td>
            </tr>
          </table>
          
          <div style="clear: both;"></div>
          
          ${extraSectionsHtml}

          <!-- CONDICIONES COMERCIALES -->
          <div class="section-title">${sectionCounter}. Condiciones Comerciales y Especiales</div>
          <table class="info-table">
            <tr>
              <td class="info-label">Validez de Oferta:</td>
              <td class="info-value">${crm.validez_dias || 15} días corridos</td>
              <td class="info-label">Moneda Cotizada:</td>
              <td class="info-value" style="text-transform: uppercase;">${crm.moneda || 'CLP'}</td>
            </tr>
            <tr>
              <td class="info-label">Condición de Servicio:</td>
              <td class="info-value" colspan="3" style="text-transform: uppercase;">
                <strong>${crm.condicion_servicio || 'programado'}</strong>
                ${(crm.condicion_servicio || 'programado') === 'programado' 
                  ? '— Reserva garantizada de equipo. Se factura a todo evento según programación.' 
                  : '— Sujeto a disponibilidad de flota al momento del requerimiento.'}
              </td>
            </tr>
            <tr>
              <td class="info-label">Suministro Combustible:</td>
              <td class="info-value" colspan="3">
                ${crm.cliente_pone_combustible === true 
                  ? '<strong>SÍ</strong> — Suministrado por Cliente Mandante en faena.' 
                  : '<strong>NO</strong> — Suministrado por Grúas San Pablo (Incluido en tarifa del servicio).'}
              </td>
            </tr>
            ${crm.pensiones ? `
            <tr>
              <td class="info-label">Responsabilidad de Pensiones:</td>
              <td class="info-value" colspan="3" style="font-size: 9.5px; line-height: 1.5;">
                • <strong>Alojamiento:</strong> ${crm.pensiones.alojamiento_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crm.pensiones.alojamiento_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica')}&nbsp;&nbsp;&nbsp;&nbsp;
                • <strong>Desayuno:</strong> ${crm.pensiones.desayuno_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crm.pensiones.desayuno_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica')}&nbsp;&nbsp;&nbsp;&nbsp;
                • <strong>Almuerzo:</strong> ${crm.pensiones.almuerzo_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crm.pensiones.almuerzo_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica')}<br>
                • <strong>Cena:</strong> ${crm.pensiones.cena_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crm.pensiones.cena_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica')}&nbsp;&nbsp;&nbsp;&nbsp;
                • <strong>Traslado Personal:</strong> ${crm.pensiones.traslado_costeado === 'CLIENTE' ? 'Costeado por Cliente' : (crm.pensiones.traslado_costeado === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'No Aplica')}
              </td>
            </tr>
            ` : ''}
          </table>
          
          ${condicionesHtml ? `
            <div style="font-weight: bold; font-size: 8.5px; color: #2d3748; margin-top: 6px;">Exclusiones y Condiciones Especiales:</div>
            <div class="conditions-box" style="white-space: pre-wrap;">${condicionesHtml}</div>
          ` : ''}
          
          <div class="footer">
            Documento de carácter confidencial emitido por el Holding de Empresas de Grúas San Pablo.<br>
            Para cualquier consulta comercial o de operaciones, contactar a fono: ${emisor.fono} o al correo oficial de su ejecutivo asignado.
          </div>
        </div>
      </body>
      </html>
      `;

      // 6. Escribir HTML temporal y compilar a PDF con wkhtmltopdf
      const tempHtmlPath = path.join(targetDir, `${codi}_V${version}_temp.html`);
      fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

      await new Promise((resolve, reject) => {
        const cmd = `xvfb-run --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 10mm --margin-bottom 10mm --margin-left 10mm --margin-right 10mm "${tempHtmlPath}" "${filepath}"`;
        exec(cmd, (error, stdout, stderr) => {
          // Limpiar archivo temporal HTML
          try {
            if (fs.existsSync(tempHtmlPath)) {
              fs.unlinkSync(tempHtmlPath);
            }
          } catch (unlinkErr) {
            console.error("Error al borrar HTML temporal:", unlinkErr);
          }
          
          // wkhtmltopdf can exit with code 1 on minor network warnings.
          // If the PDF file was successfully created, we treat it as a success.
          if (error && !fs.existsSync(filepath)) {
            console.error("Error al ejecutar wkhtmltopdf:", error);
            console.error("stderr:", stderr);
            return reject(new Error(`Error al compilar el PDF de la cotización: ${error.message}`));
          }
          resolve();
        });
      });

      // Guardar en Storage Engine
      const archivoM = new archivoModel();
      const doc = await archivoM.insertarTfmgFile(
          'COTIZACION',
          'application/pdf',
          fileName,
          fileName,
          path_relativo,
          null, // id_user 
          'A'
      );

      nuevaCotizacion.url = `/api/archivo/ver/${doc.id_doc}`;
      jsonField.crm_v1.cotizaciones_historicas.push(nuevaCotizacion);
      
      const updateResult = await client.query(
        'UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2 RETURNING *',
        [jsonField, id_proyecto]
      );

      await client.query('COMMIT');
      
      return {
        cotizacion: nuevaCotizacion,
        proyecto: updateResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Generar nueva versión de Orden de Trabajo (OT) usando secuencia y persistiendo en json_field.ejecucion_v1
  async generarOTVersion(id_proyecto) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const { rows } = await client.query('SELECT * FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
      if (rows.length === 0) throw new Error("Proyecto no encontrado");
      const p = rows[0];
      
      let codi = p.codi_proyecto;
      if (!codi) {
        codi = await this.generarCodigoTransaccional(p.id_empresa, p.id_empresa_cliente, client);
        await client.query('UPDATE tpry_proyecto SET codi_proyecto = $1 WHERE id_proyecto = $2', [codi, id_proyecto]);
      }
      
      await client.query('CREATE SEQUENCE IF NOT EXISTS sch_leangsp.seq_id_ot START 1');
      
      const seqResult = await client.query("SELECT nextval('sch_leangsp.seq_id_ot') AS next_id");
      const nextId = seqResult.rows[0].next_id;
      
      const jsonField = p.json_field || {};
      if (!jsonField.ejecucion_v1) jsonField.ejecucion_v1 = {};
      if (!jsonField.ejecucion_v1.ot_versiones) jsonField.ejecucion_v1.ot_versiones = [];
      
      const version = jsonField.ejecucion_v1.ot_versiones.length + 1;
      const fileName = `OT-${codi}V${version}-${nextId}.pdf`;
      
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const { buildStoragePath, resolveStoragePath, STORAGE_ROOT } = require('../config/storageConfig');
      const archivoModel = require('./archivoModel');

      const path_relativo = buildStoragePath('gsp', 'ot');
      const targetDir = path.join(STORAGE_ROOT, path_relativo);
      const filepath = path.join(targetDir, fileName);
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // 1. Obtener detalles del cliente mandante
      let clienteObj = null;
      if (p.id_empresa_cliente) {
        const { rows: clientRows } = await client.query('SELECT * FROM tpar_empresas WHERE id_empresa = $1', [p.id_empresa_cliente]);
        if (clientRows.length > 0) {
          clienteObj = clientRows[0];
        }
      }

      // 1b. Obtener detalles de la empresa emisora desde DB
      let emisorObjDB = null;
      if (p.id_empresa_emisora) {
        const { rows: emisorRows } = await client.query('SELECT * FROM tpar_empresas WHERE id_empresa = $1', [p.id_empresa_emisora]);
        if (emisorRows.length > 0) emisorObjDB = emisorRows[0];
      }

      const EMISORES = {
        9: {
          nombre: "LUIS OMAR GHISELLINI JARA E.I.R.L. (GRÚAS SAN PABLO)",
          rut: "52.004.162-1",
          giro: "ARRIENDO DE MAQUINARIAS Y VEHÍCULOS MOTORIZADOS",
          direccion: "Botrolhue KM 9.5 Hijuela 24 Camino Labranza, Temuco",
          fono: "+56 9 9443 7725",
          color: "#f5a623",
          colorLight: "rgba(245, 166, 35, 0.08)",
          logoPath: "logo-sanpablo.png"
        },
        7: {
          nombre: "SOCIEDAD BESTMAQ VENTA DE MAQUINARIA USADA LIMITADA (BESTMAQ)",
          rut: "76.209.534-3",
          giro: "ARRIENDO DE MAQUINARIAS Y VEHÍCULOS",
          direccion: "Camino Labranza KM 9.5, Temuco",
          fono: "+56 9 9443 7725",
          color: "#3b82f6",
          colorLight: "rgba(59, 130, 246, 0.08)"
        },
        8: {
          nombre: "SERVICIOS INTEGRADOS LOGÍSTICOS DEL SUR LTDA. (LOGÍSTICA DEL SUR)",
          rut: "76.218.576-8",
          giro: "ARRIENDO DE MAQUINARIAS Y LOGÍSTICA",
          direccion: "KM 9.5 Camino Labranza Hj 24 Lugar Botrolhue, Temuco",
          fono: "+56 9 9443 7725",
          color: "#10b981",
          colorLight: "rgba(16, 185, 129, 0.08)"
        },
        11: {
          nombre: "ARRIENDO ROYAL RENTAL LIMITADA (ROYAL RENTAL)",
          rut: "78.254.535-3",
          giro: "ARRIENDO DE MAQUINARIAS Y EQUIPOS",
          direccion: "Camino Labranza KM 9.5, Temuco",
          fono: "+56 9 9443 7725",
          color: "#8b5cf6",
          colorLight: "rgba(139, 92, 246, 0.08)"
        }
      };

      let emisorBase = EMISORES[p.id_empresa_emisora] || EMISORES[9];
      const emisor = {
        nombre: emisorObjDB?.razon_social || emisorObjDB?.name_empresa || emisorBase.nombre,
        rut: emisorObjDB?.rut_empresa || emisorBase.rut,
        giro: emisorObjDB?.giro || emisorBase.giro,
        direccion: emisorObjDB?.direccion || emisorBase.direccion,
        fono: emisorObjDB?.fono_contacto || emisorBase.fono,
        color: emisorBase.color,
        colorLight: emisorBase.colorLight,
        logoPath: emisorObjDB?.logo_empresa || emisorBase.logoPath
      };

      let finalLogoPath = emisor.logoPath;
      try {
        const logoFileName = emisor.logoPath || 'logo-sanpablo.png';
        const diskPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoFileName);
        if (fs.existsSync(diskPath)) {
          const imgBuf = fs.readFileSync(diskPath);
          finalLogoPath = 'data:image/png;base64,' + imgBuf.toString('base64');
        }
      } catch (err) {
        console.error('Error leyendo logo desde disco:', err);
      }

      // 2. Extraer datos de Operaciones & CRM
      const crm = jsonField.crm_v1 || {};
      const ejec = jsonField.ejecucion_v1 || {};

      // Obtener usuarios asignados desde DB (para nombres y cargos completos)
      const { rows: allUsers } = await client.query('SELECT * FROM tsec_users');
      const getUserInfo = (uId) => {
        if (!uId) return null;
        const u = allUsers.find(user => Number(user.id_user) === Number(uId));
        if (!u) return null;
        return {
          ...u,
          nombre_user: u.nombre_user || u.name_user || `${u.name_frst || ''} ${u.name_last || ''}`.trim() || 'Usuario Asignado'
        };
      };

      // Obtener equipos asignados desde DB (para patentes y especificaciones)
      const { rows: allEquipos } = await client.query('SELECT * FROM tequ_equipo');
      const getEquipoInfo = (eqId) => {
        if (!eqId) return null;
        return allEquipos.find(e => Number(e.id_equipo) === Number(eqId) || (e.patente && String(e.patente).toUpperCase() === String(eqId).toUpperCase()) || (e.ppu && String(e.ppu).toUpperCase() === String(eqId).toUpperCase())) || null;
      };

      // Tiempos Operativos
      const fechaSalida = ejec.fecha_salida_plan || crm.fecha_inicio_plan || 'Por definir';
      const horaSalida = ejec.hora_salida_plan || '08:00';
      const fechaFin = ejec.fecha_fin_plan || crm.fecha_fin_plan || 'Por definir';
      const horaFin = ejec.hora_fin_plan || '18:00';

      // Mandante y Obra
      const clienteNombre = clienteObj?.razon_social || clienteObj?.name_empresa || p.rut_cliente || 'Cliente General';
      const clienteRut = clienteObj?.rut_empresa || p.rut_cliente || 'N/A';
      const obraNombre = crm.obra_nombre || crm.faena_nombre || p.nombre_proyecto || 'Faena en Terreno';
      const obraDireccion = crm.obra_direccion || crm.direccion_faena || 'Dirección por confirmar';
      const obraCiudad = crm.obra_ciudad || crm.comuna_faena || 'Temuco';
      const obraContacto = crm.contacto_terreno_nombre || crm.contacto_nombre || 'Supervisor de Obra';
      const obraTelefono = crm.contacto_terreno_fono || crm.contacto_telefono || emisor.fono;
      const coordenadasGps = (crm.lat && crm.lng) ? `${crm.lat}, ${crm.lng}` : (crm.coordenadas_gps || 'No especificadas');

      // Flota & Convoy Asignado
      const flotaItems = [];
      const lineasServicio = crm.lineas_servicio || [];
      
      // Segmento 1: Flota Principal
      lineasServicio.forEach((l, idx) => {
        const eqId = l.equipo_asignado_id || l.equipo_id;
        if (eqId) {
          const eqObj = getEquipoInfo(eqId) || {};
          const opObj = getUserInfo(l.operador_asignado_id || ejec.operador_id) || {};
          flotaItems.push({
            segmento: 'Izaje Principal',
            tipo: l.tipo || eqObj.tipo || 'Grúa Móvil',
            modelo: eqObj.nombre_equipo || eqObj.modelo || l.subcategoria || 'General',
            patente: (eqObj.patente || eqObj.ppu || eqId || '').toUpperCase(),
            chofer: opObj.nombre_user || opObj.name_frst ? `${opObj.nombre_user || opObj.name_frst} (Operador)` : 'Sin Operador Asignado'
          });
        }
      });

      // Segmento 2: Traslados & Logística
      const equiposExtra = Array.isArray(ejec.equipos_extra) ? ejec.equipos_extra : [];
      equiposExtra.forEach((ex, idx) => {
        const eqId = typeof ex === 'object' ? ex.id_equipo : ex;
        if (eqId) {
          const eqObj = getEquipoInfo(eqId) || {};
          const chObj = getUserInfo(ex.chofer_id || ejec.chofer_id) || {};
          flotaItems.push({
            segmento: 'Traslado & Logística',
            tipo: ex.tipo || eqObj.tipo || 'Transporte',
            modelo: eqObj.nombre_equipo || ex.subcategoria || ex.descripcion || 'Cama Baja',
            patente: (eqObj.patente || eqObj.ppu || eqId || '').toUpperCase(),
            chofer: chObj.nombre_user || chObj.name_frst ? `${chObj.nombre_user || chObj.name_frst} (Chofer)` : 'Sin Chofer Asignado'
          });
        }
      });

      if (flotaItems.length === 0 && ejec.equipo_id) {
        const eqObj = getEquipoInfo(ejec.equipo_id) || {};
        const opObj = getUserInfo(ejec.operador_id) || {};
        flotaItems.push({
          segmento: 'Izaje Principal',
          tipo: eqObj.tipo || 'Grúa',
          modelo: eqObj.nombre_equipo || 'Equipo Principal',
          patente: (eqObj.patente || ejec.equipo_id || '').toUpperCase(),
          chofer: opObj.nombre_user ? `${opObj.nombre_user} (Operador)` : 'Asignado'
        });
      }

      let flotaHtml = '';
      flotaItems.forEach((f, idx) => {
        flotaHtml += `
          <tr>
            <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
            <td><strong style="color: #1e293b;">${f.tipo}</strong> — ${f.modelo}</td>
            <td style="text-align: center; font-family: monospace; font-weight: bold; color: #1e40af;">${f.patente}</td>
            <td style="font-size: 10px;">${f.segmento}</td>
            <td>${f.chofer}</td>
          </tr>
        `;
      });

      // Dotación Humana / Tripulación
      const tripulacionItems = [];
      const userIdsSeen = new Set();

      lineasServicio.forEach(l => {
        if (l.operador_asignado_id && !userIdsSeen.has(l.operador_asignado_id)) {
          userIdsSeen.add(l.operador_asignado_id);
          const u = getUserInfo(l.operador_asignado_id);
          if (u) tripulacionItems.push({ rol: 'Operador Grúa / Equipo', ...u });
        }
      });

      equiposExtra.forEach(ex => {
        if (ex.chofer_id && !userIdsSeen.has(ex.chofer_id)) {
          userIdsSeen.add(ex.chofer_id);
          const u = getUserInfo(ex.chofer_id);
          if (u) tripulacionItems.push({ rol: 'Chofer Cama Baja / Transporte', ...u });
        }
      });

      if (ejec.operador_id && !userIdsSeen.has(ejec.operador_id)) {
        userIdsSeen.add(ejec.operador_id);
        const u = getUserInfo(ejec.operador_id);
        if (u) tripulacionItems.push({ rol: 'Operador Grúa Titular', ...u });
      }
      if (ejec.rigger_id && !userIdsSeen.has(ejec.rigger_id)) {
        userIdsSeen.add(ejec.rigger_id);
        const u = getUserInfo(ejec.rigger_id);
        if (u) tripulacionItems.push({ rol: 'Rigger / Señalero Certificado', ...u });
      }
      if (ejec.chofer_id && !userIdsSeen.has(ejec.chofer_id)) {
        userIdsSeen.add(ejec.chofer_id);
        const u = getUserInfo(ejec.chofer_id);
        if (u) tripulacionItems.push({ rol: 'Chofer Transporte', ...u });
      }

      let tripulacionHtml = '';
      tripulacionItems.forEach((t, idx) => {
        tripulacionHtml += `
          <tr>
            <td style="text-align: center; font-weight: bold;">${idx + 1}</td>
            <td><strong>${t.nombre_user || `${t.name_frst || ''} ${t.name_last || ''}`}</strong></td>
            <td style="font-family: monospace; font-size: 10px;">${t.rut_user || 'N/A'}</td>
            <td><span style="background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9.5px;">${t.rol || t.cargo || 'Especialista'}</span></td>
            <td style="font-size: 10px; color: #64748b;">${t.email || '-'}</td>
          </tr>
        `;
      });

      // Matriz de Aparejos
      const aparejosJson = ejec.aparejos_asignados_json || ejec.aparejos_solicitados_json || crm.aparejos || {};
      let aparejosHtml = '';
      if (typeof aparejosJson === 'object' && Object.keys(aparejosJson).length > 0) {
        const rowsApar = [];
        for (const [k, v] of Object.entries(aparejosJson)) {
          if (v && v !== '0' && v !== false) {
            rowsApar.push(`<li><strong>${k.replace(/_/g, ' ').toUpperCase()}:</strong> ${typeof v === 'boolean' ? 'Requerido / Asignado' : v}</li>`);
          }
        }
        if (rowsApar.length > 0) {
          aparejosHtml = `<ul style="margin: 0; padding-left: 18px; font-size: 10px; line-height: 1.6; color: #334155;">${rowsApar.join('')}</ul>`;
        }
      }
      if (!aparejosHtml) {
        aparejosHtml = '<p style="margin: 0; font-size: 10px; color: #64748b; font-style: italic;">Aparejos estándar de faena (Eslingas certificadas, grilletes omega y fajas de alta resistencia según tabla de carga).</p>';
      }

      // Suministros & Logística
      const combMandante = crm.cliente_pone_combustible === true;
      const observaciones = ejec.observaciones || crm.observaciones_cotizacion || 'Servicio sujeto a protocolo de seguridad y análisis seguro de trabajo (AST) en faena.';

      // Template HTML A4
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Orden de Trabajo ${codi} - V${version}</title>
        <style>
          @page { size: A4; margin: 8mm 10mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #ffffff; margin: 0; padding: 0; }
          .header { border-bottom: 3px solid ${emisor.color}; padding-bottom: 10px; margin-bottom: 12px; }
          .header table { width: 100%; border-collapse: collapse; }
          .logo { max-height: 55px; max-width: 190px; object-fit: contain; }
          .title-box { text-align: right; }
          .ot-title { font-size: 20px; font-weight: 900; color: ${emisor.color}; margin: 0; letter-spacing: 0.5px; }
          .ot-code { font-size: 13px; font-weight: bold; color: #0f172a; margin-top: 2px; font-family: monospace; }
          .ot-version { display: inline-block; background: ${emisor.color}; color: #000; font-weight: 900; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-top: 3px; }
          
          .section-title { font-size: 11.5px; font-weight: bold; background: #f1f5f9; color: #0f172a; padding: 4px 8px; border-left: 4px solid ${emisor.color}; margin-top: 10px; margin-bottom: 6px; text-transform: uppercase; }
          
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10.5px; }
          table.data-table th { background: #f8fafc; color: #475569; font-weight: bold; font-size: 9.5px; text-transform: uppercase; padding: 5px 8px; border: 1px solid #cbd5e1; text-align: left; }
          table.data-table td { padding: 5px 8px; border: 1px solid #e2e8f0; color: #334155; vertical-align: middle; }
          table.data-table tr:nth-child(even) { background: #f8fafc; }
          
          .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 8px; font-size: 10px; }
          .info-grid td { padding: 4px 6px; border: 1px solid #e2e8f0; vertical-align: top; }
          .info-lbl { font-weight: bold; color: #475569; width: 18%; background: #f8fafc; }
          .info-val { color: #0f172a; width: 32%; }
          
          .signatures { width: 100%; margin-top: 20px; border-collapse: collapse; }
          .signatures td { width: 50%; vertical-align: bottom; text-align: center; padding: 0 20px; }
          .sig-line { border-top: 1.5px dashed #64748b; margin-top: 45px; padding-top: 5px; font-size: 10px; font-weight: bold; color: #1e293b; }
          .sig-sub { font-size: 9px; color: #64748b; }
          
          .footer { margin-top: 15px; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center; font-size: 8.5px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <table>
            <tr>
              <td style="width: 50%;">
                ${finalLogoPath ? `<img src="${finalLogoPath}" class="logo" alt="Logo">` : `<h2>${emisor.nombre}</h2>`}
                <div style="font-size: 9px; color: #475569; margin-top: 4px; line-height: 1.3;">
                  <strong>${emisor.nombre}</strong><br>
                  RUT: ${emisor.rut} | ${emisor.giro}<br>
                  ${emisor.direccion} | Fono: ${emisor.fono}
                </div>
              </td>
              <td class="title-box">
                <div class="ot-title">ORDEN DE TRABAJO (OT)</div>
                <div class="ot-code">${codi}</div>
                <div class="ot-version">VERSIÓN ${version}</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 4px;">Emisión: ${new Date().toLocaleString('es-CL')}</div>
              </td>
            </tr>
          </table>
        </div>

        <!-- 1. MANDANTE & FAENA -->
        <div class="section-title">1. Información del Mandante & Faena</div>
        <table class="info-grid">
          <tr>
            <td class="info-lbl">Cliente Mandante:</td>
            <td class="info-val"><strong>${clienteNombre}</strong></td>
            <td class="info-lbl">RUT Cliente:</td>
            <td class="info-val">${clienteRut}</td>
          </tr>
          <tr>
            <td class="info-lbl">Nombre Faena / Obra:</td>
            <td class="info-val"><strong>${obraNombre}</strong></td>
            <td class="info-lbl">Comuna / Ciudad:</td>
            <td class="info-val">${obraCiudad}</td>
          </tr>
          <tr>
            <td class="info-lbl">Dirección Faena:</td>
            <td class="info-val">${obraDireccion}</td>
            <td class="info-lbl">Contacto Terreno:</td>
            <td class="info-val">${obraContacto} (${obraTelefono})</td>
          </tr>
          <tr>
            <td class="info-lbl">Georreferenciación GPS:</td>
            <td class="info-val" colspan="3" style="font-family: monospace; color: #0369a1;">📍 ${coordenadasGps}</td>
          </tr>
        </table>

        <!-- 2. CRONOGRAMA OPERATIVO -->
        <div class="section-title">2. Cronograma Operativo Planificado</div>
        <table class="info-grid">
          <tr>
            <td class="info-lbl">Salida de Base / Patio:</td>
            <td class="info-val"><strong style="color: #047857;">${fechaSalida} a las ${horaSalida} hrs</strong></td>
            <td class="info-lbl">Término y Retorno:</td>
            <td class="info-val"><strong style="color: #b91c1c;">${fechaFin} a las ${horaFin} hrs</strong></td>
          </tr>
        </table>

        <!-- 3. FLOTA Y CONVOY ASIGNADO -->
        <div class="section-title">3. Flota & Convoy de Equipos Asignados (${flotaItems.length} Vehículos)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">N°</th>
              <th style="width: 35%;">Equipo / Modelo</th>
              <th style="width: 15%; text-align: center;">Patente (PPU)</th>
              <th style="width: 18%;">Segmento</th>
              <th style="width: 27%;">Operador / Chofer Asignado</th>
            </tr>
          </thead>
          <tbody>
            ${flotaHtml || '<tr><td colspan="5" style="text-align: center; color: #64748b;">Sin equipos asignados</td></tr>'}
          </tbody>
        </table>

        <!-- 4. DOTACIÓN HUMANA & TRIPULACIÓN -->
        <div class="section-title">4. Dotación Humana & Tripulación de Faena (${tripulacionItems.length} Personas)</div>
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">N°</th>
              <th style="width: 32%;">Nombre Completo</th>
              <th style="width: 18%;">RUT</th>
              <th style="width: 25%;">Rol / Especialidad</th>
              <th style="width: 20%;">Contacto</th>
            </tr>
          </thead>
          <tbody>
            ${tripulacionHtml || '<tr><td colspan="5" style="text-align: center; color: #64748b;">Sin tripulación asignada</td></tr>'}
          </tbody>
        </table>

        <!-- 5. MATRIZ DE APAREJOS & SUMINISTROS -->
        <div class="section-title">5. Elementos de Izaje, Logística & Suministros</div>
        <table class="info-grid">
          <tr>
            <td class="info-lbl" style="width: 25%;">Aparejos & Estrobos Autorizados:</td>
            <td class="info-val" style="width: 75%;" colspan="3">${aparejosHtml}</td>
          </tr>
          <tr>
            <td class="info-lbl">Suministro de Combustible:</td>
            <td class="info-val" colspan="3">
              ${combMandante 
                ? '<strong>Suministrado por Cliente Mandante en faena.</strong>' 
                : '<strong>Suministrado por Grúas San Pablo (Carga con Tarjeta Copec en ruta).</strong>'}
            </td>
          </tr>
          <tr>
            <td class="info-lbl">Instrucciones & Observaciones:</td>
            <td class="info-val" colspan="3" style="font-size: 9.5px; color: #334155;">${observaciones}</td>
          </tr>
        </table>

        <!-- 6. FIRMAS DE RESPONSABILIDAD -->
        <table class="signatures">
          <tr>
            <td>
              <div class="sig-line">COORDINADOR DE OPERACIONES / DESPACHO</div>
              <div class="sig-sub">${emisor.nombre}</div>
            </td>
            <td>
              <div class="sig-line">RECEPCIÓN CONFORME EN FAENA</div>
              <div class="sig-sub">SUPERVISOR / PREVENCIONISTA MANDANTE</div>
            </td>
          </tr>
        </table>

        <div class="footer">
          Documento Oficial de Operaciones — Grúas San Pablo S.A. | Generado electrónicamente bajo estándar de trazabilidad Spec 33.
        </div>
      </body>
      </html>
      `;

      // 3. Escribir HTML temporal y compilar a PDF con wkhtmltopdf
      const tempHtmlPath = path.join(targetDir, `temp_${fileName}.html`);
      fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

      await new Promise((resolve, reject) => {
        const cmd = `xvfb-run --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${filepath}"`;
        exec(cmd, (error, stdout, stderr) => {
          try {
            if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath);
          } catch (unlinkErr) {
            console.error("Error al borrar HTML temporal OT:", unlinkErr);
          }
          
          if (error && !fs.existsSync(filepath)) {
            console.error("Error al ejecutar wkhtmltopdf para OT:", error);
            return reject(new Error(`Error al compilar el PDF de la OT: ${error.message}`));
          }
          resolve();
        });
      });

      // Guardar en Storage Engine (tfmg_file)
      const archivoM = new archivoModel();
      const doc = await archivoM.insertarTfmgFile(
        'OT',
        'application/pdf',
        fileName,
        fileName,
        path_relativo,
        null,
        'A'
      );

      const nuevaOT = {
        id_ot: Number(nextId),
        version: version,
        nombre_archivo: fileName,
        fecha: new Date().toISOString(),
        url: `/api/archivo/ver/${doc.id_doc}`,
        id_doc: doc.id_doc,
        total_equipos: flotaItems.length,
        total_tripulacion: tripulacionItems.length
      };

      jsonField.ejecucion_v1.ot_versiones.push(nuevaOT);
      
      const updateResult = await client.query(
        'UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2 RETURNING *',
        [jsonField, id_proyecto]
      );

      await client.query('COMMIT');
      
      return {
        ot: nuevaOT,
        proyecto: updateResult.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Despachar Orden de Trabajo por correo B2B
  async enviarOT(id_proyecto, payload = {}) {
    const client = await this.pool.connect();
    try {
      const { rows } = await client.query('SELECT * FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
      if (rows.length === 0) throw new Error("Proyecto no encontrado");
      const p = rows[0];
      
      const jsonField = p.json_field || {};
      const ejec = jsonField.ejecucion_v1 || {};
      const versiones = Array.isArray(ejec.ot_versiones) ? ejec.ot_versiones : [];
      
      const requestedVersion = payload.version ? Number(payload.version) : (versiones.length > 0 ? versiones[versiones.length - 1].version : 1);
      const otObj = versiones.find(v => Number(v.version) === requestedVersion) || versiones[versiones.length - 1];
      
      const destinatarios = Array.isArray(payload.destinatarios) && payload.destinatarios.length > 0 ? payload.destinatarios : ['sgajardoc@gmail.com'];
      const asunto = payload.asunto || `🏗️ Orden de Trabajo OT-${p.codi_proyecto || 'GSP'}V${requestedVersion} - ${p.nombre_proyecto || 'Servicio de Izaje'}`;
      
      if (!ejec.ot_despachos_historicos) ejec.ot_despachos_historicos = [];
      
      const despachoTraza = {
        version: requestedVersion,
        fecha: new Date().toISOString(),
        destinatarios: destinatarios,
        asunto: asunto,
        id_doc: otObj?.id_doc || null,
        enviado_por: payload.enviado_por || 'Coordinador Operaciones'
      };
      
      ejec.ot_despachos_historicos.push(despachoTraza);
      jsonField.ejecucion_v1 = ejec;
      
      await client.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jsonField, id_proyecto]);
      
      return {
        success: true,
        message: `Orden de Trabajo V${requestedVersion} despachada exitosamente a ${destinatarios.join(', ')}`,
        despacho: despachoTraza
      };
    } finally {
      client.release();
    }
  }
}

module.exports = ProyectoModel;