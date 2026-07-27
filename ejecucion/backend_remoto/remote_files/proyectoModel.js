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
  async generarCodigoTransaccional(id_empresa, providedClient = null) {
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
        INSERT INTO tpry_correlativos (id_empresa, prefijo, anio_mes, ultimo_valor)
        VALUES ($1, $2, $3, 0)
        ON CONFLICT (id_empresa, anio_mes) DO NOTHING;
      `, [id_empresa, prefijo, anio_mes]);

      // Bloqueamos e incrementamos de forma atómica
      const result = await client.query(`
        UPDATE tpry_correlativos 
        SET ultimo_valor = ultimo_valor + 1
        WHERE id_empresa = $1 AND anio_mes = $2
        RETURNING ultimo_valor, prefijo;
      `, [id_empresa, anio_mes]);

      const nuevoValor = result.rows[0].ultimo_valor;
      const pref = result.rows[0].prefijo;
      const correlativo = String(nuevoValor).padStart(3, '0');
      
      const codigo = `${pref}-${anio_mes}-${correlativo}`;

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
        codi = await this.generarCodigoTransaccional(p.id_empresa, client);
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
        url: `/lg-gsp/api/archivo/cotizaciones/${fileName}`
      };
      
      jsonField.crm_v1.cotizaciones_historicas.push(nuevaCotizacion);
      
      const updateResult = await client.query(
        'UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2 RETURNING *',
        [jsonField, id_proyecto]
      );
      
      // Escribir un archivo PDF real e imprimible (HTML-to-PDF)
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const { LEAN_DOCS_BASE_DIR } = require('../config/docsConfig');
      const targetDir = path.join(LEAN_DOCS_BASE_DIR, 'cotizaciones');
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
      if (finalLogoPath && !finalLogoPath.startsWith('data:image')) {
        finalLogoPath = 'file://' + path.join('/var/www/html/lg-gsp', finalLogoPath);
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
              <td class="info-label">Revisión/Visita:</td>
              <td class="info-value">${crm.visita_terreno || 'No'}</td>
              <td class="info-label">Ubicación Obra:</td>
              <td class="info-value">
                ${crm.obra_direccion || '—'}${crm.obra_ciudad ? ', ' + crm.obra_ciudad : ''}
                ${crm.coordenadas_mapa?.lat ? `<br><img src="https://static-maps.yandex.ru/1.x/?ll=${crm.coordenadas_mapa.lng},${crm.coordenadas_mapa.lat}&z=15&l=map&size=200,120&pt=${crm.coordenadas_mapa.lng},${crm.coordenadas_mapa.lat},pm2rdl" style="margin-top: 5px; max-width: 200px; border: 1px solid #e2e8f0; border-radius: 4px;" alt="Mapa de Ubicación" /><br><span style="font-size: 8px; color: #718096; font-family: monospace;">Coord: ${crm.coordenadas_mapa.lat}, ${crm.coordenadas_mapa.lng}</span>` : ''}
              </td>
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
        const cmd = `xvfb-run --server-args="-screen 0 1024x768x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait "${tempHtmlPath}" "${filepath}"`;
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
}

module.exports = ProyectoModel;
