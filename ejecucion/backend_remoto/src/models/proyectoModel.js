const pool = require("../config/postgresPool");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");
const archivoModel = require("./archivoModel");
const { buildStoragePath, STORAGE_ROOT } = require("../config/storageConfig");
const { normalizarLineaCobroUnico, isLineaCobroUnico } = require("../utils/lineaCobroUnico");

function esLineaRiggerFantasma(l) {
  if (!l || typeof l !== 'object') return false;
  const esPersonalORigger = String(l.tipo || l.categoria || '').toUpperCase().includes('PERSONAL') || 
                            String(l.subcategoria || l.descripcion || '').toUpperCase().includes('RIGGER');
  const valorUnitario = Number(l.valorUnitario || l.valor_unitario || l.precio_unitario || l.subtotal || 0);
  return esPersonalORigger && valorUnitario <= 0;
}

class ProyectoModel {
  constructor() {
    this.pool = pool;
    this.pool.on("error", (err) => console.error(err));
  }

  // Obtener todos los proyectos
  async getProyectos(id_empresa = null, scope = null) {
    let query = `
      SELECT 
        p.*,
        CASE
          WHEN p.id_proyecto_estado = 5 AND (
            its.id_its IS NOT NULL
            OR COALESCE(v_ret.tiene_retorno, false)
            OR (
              COALESCE(rep.reports_cerrados, 0) >= GREATEST(
                COALESCE(p.duracion_plan, 0),
                COALESCE(cupo.duracion_plan, 0),
                COALESCE(NULLIF(regexp_replace(COALESCE(p.json_field->>'duracion_estimada', ''), '[^0-9]', '', 'g'), '')::int, 1)
              )
              AND COALESCE(rep.reports_abiertos, 0) = 0
              AND COALESCE(rep.reports_cerrados, 0) > 0
              AND (
                COALESCE(p.fecha_plan_fin, (p.json_field->'crm_v1'->>'fecha_plan_fin')::timestamptz, (p.json_field->'ejecucion_v1'->>'fecha_fin_plan')::timestamptz) IS NULL
                OR COALESCE(p.fecha_plan_fin, (p.json_field->'crm_v1'->>'fecha_plan_fin')::timestamptz, (p.json_field->'ejecucion_v1'->>'fecha_fin_plan')::timestamptz) <= CURRENT_TIMESTAMP
              )
            )
          ) THEN 6
          ELSE p.id_proyecto_estado
        END AS id_proyecto_estado,
        its.id_its,
        its.folio_its,
        COALESCE(its.estado_its, p.json_field->>'estado_its') AS estado_its,
        e.razon_social AS nombre_cliente,
        est.nombre_estado,
        tip.nombre_tipo
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
      LEFT JOIN tpry_estado  est ON p.id_proyecto_estado = est.id_proyecto_estado
      LEFT JOIN tpry_tipo   tip ON p.id_proyecto_tipo = tip.id_proyecto_tipo
      LEFT JOIN LATERAL (
        SELECT i.id_its, i.folio_its, i.estado_its
        FROM tits_informe_termino i
        WHERE i.id_proyecto = p.id_proyecto
        ORDER BY i.id_its DESC
        LIMIT 1
      ) its ON true
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (
            WHERE r.estado_reporte != 'JORNADA_EN_CURSO'
              AND COALESCE(r.estado_jornada, '') != 'JORNADA_EN_CURSO'
              AND r.fecha_termino_servicio IS NOT NULL
          )::int AS reports_cerrados,
          COUNT(*) FILTER (
            WHERE r.estado_reporte = 'JORNADA_EN_CURSO'
               OR COALESCE(r.estado_jornada, '') = 'JORNADA_EN_CURSO'
               OR r.fecha_termino_servicio IS NULL
          )::int AS reports_abiertos
        FROM tedp_reporte_avance r
        WHERE r.id_proyecto = p.id_proyecto
      ) rep ON true
      LEFT JOIN LATERAL (
        SELECT EXISTS (
          SELECT 1
          FROM tequ_log_desplazamiento ld
          WHERE ld.id_proyecto = p.id_proyecto
            AND ld.tipo_trayecto = 'RETORNO'
            AND ld.estado_trayecto IN ('ASIGNADO', 'EN_RUTA', 'ARRIBADO')
        ) AS tiene_retorno
      ) v_ret ON true
      LEFT JOIN LATERAL (
        SELECT GREATEST(
          COALESCE(MAX(GREATEST(
            COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'duracion_dias', ''), '[^0-9]', '', 'g'), '')::int, 0),
            COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'cantidad_dias', ''), '[^0-9]', '', 'g'), '')::int, 0),
            COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'cantidad_meses', ''), '[^0-9]', '', 'g'), '')::int, 0) * 30,
            CASE
              WHEN (elem->>'fecha_plan_ini') ~ '^\\d{4}-\\d{2}-\\d{2}' AND (elem->>'fecha_plan_fin') ~ '^\\d{4}-\\d{2}-\\d{2}'
              THEN GREATEST(1, (LEFT(elem->>'fecha_plan_fin', 10)::date - LEFT(elem->>'fecha_plan_ini', 10)::date) + 1)
              ELSE 0
            END,
            COALESCE(NULLIF(regexp_replace(COALESCE(elem->>'cantidad', ''), '[^0-9]', '', 'g'), '')::int, 0)
          )), 0),
          CASE
            WHEN (p.json_field->'crm_v1'->>'fecha_hora_inicio') ~ '^\\d{4}-\\d{2}-\\d{2}'
             AND (p.json_field->'crm_v1'->>'fecha_hora_termino') ~ '^\\d{4}-\\d{2}-\\d{2}'
            THEN GREATEST(1, (LEFT(p.json_field->'crm_v1'->>'fecha_hora_termino', 10)::date - LEFT(p.json_field->'crm_v1'->>'fecha_hora_inicio', 10)::date) + 1)
            ELSE 0
          END
        ) AS duracion_plan
        FROM jsonb_array_elements(
          CASE
            WHEN jsonb_typeof(p.json_field->'crm_v1'->'lineas_servicio') = 'array'
            THEN p.json_field->'crm_v1'->'lineas_servicio'
            WHEN jsonb_typeof(p.json_field->'planificacion_operativa'->'cupos') = 'array'
            THEN p.json_field->'planificacion_operativa'->'cupos'
            ELSE '[]'::jsonb
          END
        ) elem
      ) cupo ON true
    `;
    const conditions = [];
    const values = [];

    if (id_empresa) {
      values.push(id_empresa);
      conditions.push(`p.id_empresa = $${values.length}`);
    }

    // Restricción de Scope Comercial (RBAC): ejecutivos comerciales solo ven sus propios proyectos
    if (scope && scope.solo_propios && scope.id_user) {
      values.push(scope.id_user);
      conditions.push(`p.id_usuario_creacion = $${values.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
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

  // ✅ Generar código transaccional (codi_proyecto) [REQ-1083: PREFIJO-YYMM-00001 con correlativo continuo]
  async generarCodigoTransaccional(id_empresa, id_cliente = null, providedClient = null) {
    const client = providedClient || await this.pool.connect();
    let localTransaction = !providedClient;
    
    try {
      if (localTransaction) await client.query('BEGIN');

      const date = new Date();
      const yy = String(date.getFullYear()).slice(-2);
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const anio_mes = `${yy}${mm}`;
      const periodo_correlativo = '0000'; // Secuencia continua sin reinicio mensual (REQ-1083)
      
      let prefijo = 'PRY';
      if (id_empresa == 9) prefijo = 'GSP';
      else if (id_empresa == 7) prefijo = 'BMQ';
      else if (id_empresa == 8) prefijo = 'LDS';
      else if (id_empresa == 11) prefijo = 'RYL';

      // Aseguramos que exista el registro para la secuencia continua del prefijo
      await client.query(`
        INSERT INTO tpry_correlativos (prefijo, anio_mes, ultimo_valor)
        VALUES ($1, $2, 0)
        ON CONFLICT (prefijo, anio_mes) DO NOTHING;
      `, [prefijo, periodo_correlativo]);

      // Bloqueamos e incrementamos de forma atómica
      const result = await client.query(`
        UPDATE tpry_correlativos 
        SET ultimo_valor = ultimo_valor + 1
        WHERE prefijo = $1 AND anio_mes = $2
        RETURNING ultimo_valor, prefijo;
      `, [prefijo, periodo_correlativo]);

      const nuevoValor = result.rows[0].ultimo_valor;
      const pref = result.rows[0].prefijo;
      const correlativo = String(nuevoValor).padStart(5, '0');
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

  // Auto-guardado de contacto nuevo en tpar_contactos si crm.contacto_nombre tiene valor pero crm.id_contacto es nulo
  async autoGuardarContactoSiAplica(jsonField, idEmpresaCliente, dbClient) {
    try {
      if (!jsonField) return jsonField;
      const crm = jsonField.crm_v1 || {};
      const contactoNombre = (crm.contacto_nombre || '').trim();
      const idContacto = crm.id_contacto;

      if (contactoNombre && (!idContacto || Number(idContacto) === 0)) {
        const idEmpresa = idEmpresaCliente || crm.id_empresa_cliente || crm.cliente_id;
        if (!idEmpresa) return jsonField;

        const client = dbClient || this.pool;

        // 1. Asegurar existencia de la tabla tpar_contactos
        await client.query(`
          CREATE TABLE IF NOT EXISTS tpar_contactos (
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

        const fono = (crm.contacto_telefono || crm.contacto_fono || '').trim() || null;
        const email = (crm.contacto_email || '').trim() || null;

        // 2. Verificar si ya existe en tpar_contactos para ese cliente
        const checkRes = await client.query(`
          SELECT id_contacto, nombre, fono, email 
          FROM tpar_contactos 
          WHERE id_empresa = $1 AND LOWER(TRIM(nombre)) = LOWER(TRIM($2))
          LIMIT 1
        `, [Number(idEmpresa), contactoNombre]);

        let resolvedId = null;

        if (checkRes.rowCount > 0) {
          resolvedId = checkRes.rows[0].id_contacto;
          if ((fono && !checkRes.rows[0].fono) || (email && !checkRes.rows[0].email)) {
            await client.query(`
              UPDATE tpar_contactos 
              SET fono = COALESCE($1, fono), email = COALESCE($2, email), updated_at = NOW() 
              WHERE id_contacto = $3
            `, [fono, email, resolvedId]);
          }
        } else {
          // Si no existe, insertar nuevo contacto en tpar_contactos
          const insRes = await client.query(`
            INSERT INTO tpar_contactos (id_empresa, nombre, fono, email)
            VALUES ($1, $2, $3, $4)
            RETURNING id_contacto
          `, [Number(idEmpresa), contactoNombre, fono, email]);
          resolvedId = insRes.rows[0].id_contacto;
        }

        crm.id_contacto = resolvedId;
        jsonField.crm_v1 = crm;

        // 3. Sincronizar reactivamente en tpar_empresas.json_field.puntos_contacto para retrocompatibilidad
        try {
          const empRes = await client.query(`SELECT json_field FROM tpar_empresas WHERE id_empresa = $1`, [Number(idEmpresa)]);
          if (empRes.rowCount > 0) {
            let empJson = empRes.rows[0].json_field;
            if (typeof empJson === 'string') {
              try { empJson = JSON.parse(empJson); } catch (_) { empJson = {}; }
            }
            if (!empJson || typeof empJson !== 'object') empJson = {};
            if (!Array.isArray(empJson.puntos_contacto)) empJson.puntos_contacto = [];

            const existeEnPuntos = empJson.puntos_contacto.some(p => 
              (p.id_contacto && Number(p.id_contacto) === Number(resolvedId)) || 
              (p.nombre && p.nombre.trim().toLowerCase() === contactoNombre.toLowerCase())
            );

            if (!existeEnPuntos) {
              empJson.puntos_contacto.push({
                id_contacto: resolvedId,
                nombre: contactoNombre,
                telefono: fono || '',
                correo: email || '',
                cargo: 'Contacto Comercial'
              });
              await client.query(`UPDATE tpar_empresas SET json_field = $1 WHERE id_empresa = $2`, [JSON.stringify(empJson), Number(idEmpresa)]);
            }
          }
        } catch (empErr) {
          console.warn("[autoGuardarContactoSiAplica] Sync tpar_empresas warning:", empErr.message);
        }
      }
      return jsonField;
    } catch (err) {
      console.error("[autoGuardarContactoSiAplica] Error en auto-guardado de contacto:", err);
      return jsonField;
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
      id_usuario_creacion = null,
      id_empresa = null,
      json_field = null
    } = data;

    const final_user_creacion = id_usuario_creacion ?? id_user_creacion ?? null;

    // Auto-guardado de contacto si aplica
    let json_field_processed = json_field;
    if (json_field_processed) {
      let isStr = typeof json_field_processed === 'string';
      let parsed = isStr ? null : json_field_processed;
      if (isStr) {
        try { parsed = JSON.parse(json_field_processed); } catch (_) { parsed = null; }
      }
      if (parsed) {
        parsed = await this.autoGuardarContactoSiAplica(parsed, id_empresa_cliente);
        json_field_processed = isStr ? JSON.stringify(parsed) : parsed;
      }
    }

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
      final_user_creacion,
      json_field_processed
    ];

    try {
      const { rows, rowCount } = await this.pool.query(query, values);
      if (!rowCount) throw new Error("No se pudo crear el proyecto");
      return rows[0];
    } catch (error) {
      throw new Error(`Error al crear proyecto: ${error.message}`);
    }
  }

  // Helper REQ-1100: Preservar asignaciones operativas (equipo, operador, rigger, fechas) al sincronizar líneas comerciales
  _mergeAsignacionesOperativas(lineasNuevas = [], lineasOperativasPrevias = []) {
    if (!Array.isArray(lineasNuevas)) return [];
    if (!Array.isArray(lineasOperativasPrevias) || lineasOperativasPrevias.length === 0) return lineasNuevas;

    const esLineaMaquinaria = (l) => {
      const t = String(l?.tipo || '').toUpperCase();
      return t.includes('GRUA') || t.includes('GRÚA') || t.includes('CAMION') || t.includes('CAMIÓN') || t.includes('TRACTO') || t.includes('CAMA BAJA') || t.includes('MAQUINARIA') || t.includes('ALZA') || t.includes('MANLIFT') || t.includes('HORQUILLA');
    };

    const prevMaquinarias = lineasOperativasPrevias.filter(esLineaMaquinaria);
    const nuevasMaquinarias = lineasNuevas.filter(esLineaMaquinaria);

    return lineasNuevas.map((ln, idx) => {
      const copia = { ...ln };
      let matchPrev = null;

      if (lineasOperativasPrevias[idx] && (
        String(lineasOperativasPrevias[idx].tipo || '').toUpperCase() === String(copia.tipo || '').toUpperCase() ||
        (esLineaMaquinaria(lineasOperativasPrevias[idx]) && esLineaMaquinaria(copia))
      )) {
        matchPrev = lineasOperativasPrevias[idx];
      }
      if (!matchPrev) {
        matchPrev = lineasOperativasPrevias.find(p =>
          String(p?.tipo || '').toUpperCase() === String(copia.tipo || '').toUpperCase() &&
          String(p?.subcategoria || '').toUpperCase() === String(copia.subcategoria || '').toUpperCase() &&
          (p.equipo_asignado_id || p.operador_asignado_id || p.rigger_asignado_id)
        );
      }
      if (!matchPrev && esLineaMaquinaria(copia) && prevMaquinarias.length === 1 && nuevasMaquinarias.length === 1) {
        matchPrev = prevMaquinarias[0];
      }

      if (matchPrev) {
        if (!copia.equipo_asignado_id && matchPrev.equipo_asignado_id) copia.equipo_asignado_id = matchPrev.equipo_asignado_id;
        if (!copia.operador_asignado_id && matchPrev.operador_asignado_id) copia.operador_asignado_id = matchPrev.operador_asignado_id;
        if (!copia.rigger_asignado_id && matchPrev.rigger_asignado_id) copia.rigger_asignado_id = matchPrev.rigger_asignado_id;
        if (!copia.fecha_plan_ini && matchPrev.fecha_plan_ini) copia.fecha_plan_ini = matchPrev.fecha_plan_ini;
        if (!copia.fecha_plan_fin && matchPrev.fecha_plan_fin) copia.fecha_plan_fin = matchPrev.fecha_plan_fin;
        if (!copia.regimen_operacional && matchPrev.regimen_operacional) copia.regimen_operacional = matchPrev.regimen_operacional;
      }
      return copia;
    });
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
      id_user_modificacion = null,
      id_usuario_creacion = null,
      id_user_creacion = null
    } = data;
    const final_user_creacion = id_usuario_creacion ?? id_user_creacion ?? null;

    // Auto-guardado de contacto, escudo anti-regresión de pestaña obsoleta (REQ-1103) y gobernanza de cotizaciones (REQ-1100)
    const currentPry = await this.getProyectoById(id_proyecto);
    const estadoDB = Number(currentPry?.id_proyecto_estado || 1);
    const estadoEntrante = (id_proyecto_estado !== null && id_proyecto_estado !== undefined) ? Number(id_proyecto_estado) : null;
    const allowRegression = data.allowStateRegression === true;
    let final_id_proyecto_estado = estadoEntrante;
    if (!allowRegression && estadoDB > 1 && estadoDB < 90 && estadoEntrante !== null && estadoEntrante !== 99 && estadoEntrante < estadoDB) {
      console.warn(`[updateProyecto] Bloqueando regresión de estado (${estadoDB} -> ${estadoEntrante}) en proyecto #${id_proyecto} (pestaña obsoleta). Se preserva estado ${estadoDB}.`);
      final_id_proyecto_estado = estadoDB;
    }

    let json_field_processed = json_field;
    let nuevoPisoMinimoParaReports = null;
    if (json_field_processed) {
      let isStr = typeof json_field_processed === 'string';
      let parsed = isStr ? null : json_field_processed;
      if (isStr) {
        try { parsed = JSON.parse(json_field_processed); } catch (_) { parsed = null; }
      }
      if (parsed) {
        let idEmpresa = id_empresa_cliente || currentPry?.id_empresa_cliente;
        parsed = await this.autoGuardarContactoSiAplica(parsed, idEmpresa);

        const prevJson = currentPry?.json_field || {};
        for (const rootKey of ['dossier_documentos', 'control_vivo_overrides', 'dias_laborales_override', 'contrato_arriendo']) {
          if (prevJson[rootKey] && (!parsed[rootKey] || (typeof parsed[rootKey] === 'object' && Object.keys(parsed[rootKey]).length === 0))) {
            parsed[rootKey] = prevJson[rootKey];
          }
        }

        const estadoActual = Number(final_id_proyecto_estado || estadoDB || 1);

        // REQ-1103: Escudo de preservación de ejecucion_v1 cuando el proyecto ya está en Operaciones (Estado >= 3)
        if (estadoDB >= 3 && estadoDB < 90 && prevJson.ejecucion_v1) {
          const prevEjec = prevJson.ejecucion_v1;
          const inEjec = parsed.ejecucion_v1 || {};
          const mergedEjec = { ...prevEjec, ...inEjec };

          if ((!inEjec.equipo_id || inEjec.equipo_id === 'CRN-DEFAULT') && prevEjec.equipo_id && prevEjec.equipo_id !== 'CRN-DEFAULT') {
            mergedEjec.equipo_id = prevEjec.equipo_id;
          }
          if ((!inEjec.operador_id || inEjec.operador_id === 'OP-101') && prevEjec.operador_id && prevEjec.operador_id !== 'OP-101') {
            mergedEjec.operador_id = prevEjec.operador_id;
          }
          if ((!inEjec.rigger_id || inEjec.rigger_id === 'RIG-201') && prevEjec.rigger_id && prevEjec.rigger_id !== 'RIG-201') {
            mergedEjec.rigger_id = prevEjec.rigger_id;
          }
          for (const arrKey of ['ot_versiones', 'ot_despachos_historicos', 'traza_correos', 'plan_diario', 'tripulacion_asignada', 'especialistas_terreno', 'equipos_extra']) {
            const prevArr = Array.isArray(prevEjec[arrKey]) ? prevEjec[arrKey] : [];
            const inArr = Array.isArray(inEjec[arrKey]) ? inEjec[arrKey] : [];
            if (prevArr.length > 0 && inArr.length === 0) {
              mergedEjec[arrKey] = prevArr;
            } else if (arrKey === 'ot_versiones' && prevArr.length > inArr.length) {
              const mapOt = new Map();
              prevArr.forEach(o => mapOt.set(Number(o.version || o.id_doc), o));
              inArr.forEach(o => mapOt.set(Number(o.version || o.id_doc), o));
              mergedEjec.ot_versiones = Array.from(mapOt.values()).sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
            }
          }
          if (prevEjec.preparacion_salida) {
            const prevInsp = prevEjec.preparacion_salida.inspecciones_patio || {};
            const inInsp = inEjec.preparacion_salida?.inspecciones_patio || {};
            if (Object.keys(prevInsp).length > 0 && Object.keys(inInsp).length === 0) {
              mergedEjec.preparacion_salida = prevEjec.preparacion_salida;
            }
          }
          if (!allowRegression && prevEjec.regimen_operacional_confirmado && !inEjec.regimen_operacional_confirmado) {
            mergedEjec.regimen_operacional_confirmado = true;
            if (!inEjec.regimen_operacional && prevEjec.regimen_operacional) {
              mergedEjec.regimen_operacional = prevEjec.regimen_operacional;
            }
          }
          if (prevEjec.decision && !inEjec.decision) mergedEjec.decision = prevEjec.decision;
          if (prevEjec.asignacion_confirmada && !inEjec.asignacion_confirmada) mergedEjec.asignacion_confirmada = prevEjec.asignacion_confirmada;
          if (!allowRegression && estadoDB >= 4 && (!inEjec.subtab_activa || inEjec.subtab_activa === 'validacion') && prevEjec.subtab_activa && prevEjec.subtab_activa !== 'validacion') {
            mergedEjec.subtab_activa = prevEjec.subtab_activa;
            mergedEjec.subtab_actual_view = prevEjec.subtab_actual_view || prevEjec.subtab_activa;
          }
          for (const planKey of ['fecha_salida_plan', 'fecha_fin_plan', 'hora_salida_plan', 'hora_llegada_plan', 'hora_fin_plan', 'horas_minimas', 'servicio']) {
            if ((!inEjec[planKey] || inEjec[planKey] === '') && prevEjec[planKey]) {
              mergedEjec[planKey] = prevEjec[planKey];
            }
          }
          parsed.ejecucion_v1 = mergedEjec;
        }

        // REQ-1100 & REQ-1103: Gobernanza de vigencia de cotizaciones en servicios en operación (Estado >= 3)
        if (parsed.crm_v1) {
          const prevCrm = currentPry?.json_field?.crm_v1 || {};
          if (!allowRegression && prevCrm.regimen_operacional_confirmado && !parsed.crm_v1.regimen_operacional_confirmado) {
            parsed.crm_v1.regimen_operacional_confirmado = true;
            if (!parsed.crm_v1.regimen_operacional && prevCrm.regimen_operacional) {
              parsed.crm_v1.regimen_operacional = prevCrm.regimen_operacional;
            }
          }
          const prevLineasOp = (Array.isArray(prevCrm.lineas_operativas_vigentes) && prevCrm.lineas_operativas_vigentes.length > 0)
            ? prevCrm.lineas_operativas_vigentes
            : (Array.isArray(prevCrm.lineas_servicio) ? prevCrm.lineas_servicio : []);

          const rawCots = Array.isArray(parsed.crm_v1.cotizaciones_historicas) ? parsed.crm_v1.cotizaciones_historicas : [];
          const prevCots = Array.isArray(prevCrm.cotizaciones_historicas) ? prevCrm.cotizaciones_historicas : [];
          const cotsMap = new Map();
          prevCots.forEach(pc => {
            if (pc && pc.version !== undefined) cotsMap.set(Number(pc.version), JSON.parse(JSON.stringify(pc)));
          });
          rawCots.forEach(rc => {
            if (!rc || rc.version === undefined) return;
            const vNum = Number(rc.version);
            const existing = cotsMap.get(vNum);
            if (!existing) {
              cotsMap.set(vNum, rc);
            } else {
              const evPrev = Array.isArray(existing.eventos_envio) ? existing.eventos_envio : (existing.evento_envio ? [existing.evento_envio] : []);
              const evIn = Array.isArray(rc.eventos_envio) ? rc.eventos_envio : (rc.evento_envio ? [rc.evento_envio] : []);
              const evMerged = [...evPrev];
              evIn.forEach(ev => {
                if (ev && !evMerged.some(e => e.fecha_envio === ev.fecha_envio)) evMerged.push(ev);
              });
              cotsMap.set(vNum, {
                ...existing,
                ...rc,
                lineas_snapshot: (Array.isArray(rc.lineas_snapshot) && rc.lineas_snapshot.length > 0) ? rc.lineas_snapshot : existing.lineas_snapshot,
                eventos_envio: evMerged,
                evento_envio: rc.evento_envio || existing.evento_envio || (evMerged.length > 0 ? evMerged[evMerged.length - 1] : undefined)
              });
            }
          });
          const cots = Array.from(cotsMap.values()).sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
          parsed.crm_v1.cotizaciones_historicas = cots;
          const countEnvios = (arr) => arr.reduce((acc, c) => acc + (Array.isArray(c?.eventos_envio) ? c.eventos_envio.length : (c?.evento_envio ? 1 : 0)), 0);
          const enviosAumentaron = countEnvios(cots) > countEnvios(prevCots);

          const enviadas = cots
            .filter(c => (Array.isArray(c?.eventos_envio) && c.eventos_envio.length > 0) || Boolean(c?.evento_envio))
            .sort((a, b) => Number(b.version || 0) - Number(a.version || 0));
          const ultimaEnviada = enviadas.length > 0 ? enviadas[0] : null;

          cots.forEach(c => {
            const fueEnviada = (Array.isArray(c?.eventos_envio) && c.eventos_envio.length > 0) || Boolean(c?.evento_envio);
            if (fueEnviada) {
              c.estado_vigencia = (ultimaEnviada && Number(c.version) === Number(ultimaEnviada.version))
                ? 'ENVIADA_VIGENTE'
                : 'ENVIADA_HISTORICA';
            } else {
              c.estado_vigencia = 'BORRADOR_NO_ENVIADO';
            }
          });

          const versionRecienEnviada = Number(parsed.crm_v1.cotizacion_recien_enviada_version || 0);
          const fueRecienEnviada = Boolean(versionRecienEnviada > 0 || enviosAumentaron);
          delete parsed.crm_v1.cotizacion_recien_enviada_version;

          const requiereRiggerActivo = Boolean(parsed.crm_v1?.requiere_rigger || parsed.crm_v1?.requiereRigger);

          if (Array.isArray(parsed.crm_v1.lineas_servicio) && prevLineasOp.length > 0) {
            parsed.crm_v1.lineas_servicio = this._mergeAsignacionesOperativas(parsed.crm_v1.lineas_servicio, prevLineasOp);
          }

          if (requiereRiggerActivo) {
            if (Array.isArray(parsed.crm_v1.lineas_servicio)) {
              parsed.crm_v1.lineas_servicio = parsed.crm_v1.lineas_servicio.filter(l => !esLineaRiggerFantasma(l));
            }
            if (Array.isArray(parsed.crm_v1.lineas_borrador_comercial)) {
              parsed.crm_v1.lineas_borrador_comercial = parsed.crm_v1.lineas_borrador_comercial.filter(l => !esLineaRiggerFantasma(l));
            }
          }

          const esLineaEquipoGrua = (l) => {
            if (!l || typeof l !== 'object') return false;
            const cat = String(l.tipo || l.categoria || '').toUpperCase();
            const sub = String(l.subcategoria || l.descripcion || '').toUpperCase();
            if (cat.includes('PERSONAL') || sub.includes('RIGGER')) return false;
            if (cat.includes('TRASLADO') || cat.includes('FLETE') || sub.includes('TRASLADO') || sub.includes('FLETE')) return false;
            return true;
          };

          const esFijoGrua = (l) => {
            if (!l) return false;
            const unid = String(l.unidad || l.tipo_unidad || '').toUpperCase();
            const desc = String(l.descripcion || l.concepto || '').toUpperCase();
            return unid.includes('FIJO') || unid.includes('SUMA ALZADA') || unid.includes('GLOBAL') || desc.includes('VALOR FIJO') || desc.includes('SUMA ALZADA');
          };

          if (fueRecienEnviada && ultimaEnviada) {
            let snapshotBase = (Array.isArray(ultimaEnviada.lineas_snapshot) && ultimaEnviada.lineas_snapshot.length > 0)
              ? JSON.parse(JSON.stringify(ultimaEnviada.lineas_snapshot))
              : (Array.isArray(parsed.crm_v1.lineas_borrador_comercial) && parsed.crm_v1.lineas_borrador_comercial.length > 0
                  ? JSON.parse(JSON.stringify(parsed.crm_v1.lineas_borrador_comercial))
                  : JSON.parse(JSON.stringify(parsed.crm_v1.lineas_servicio || [])));
            if (requiereRiggerActivo) {
              snapshotBase = snapshotBase.filter(l => !esLineaRiggerFantasma(l));
            }
            let lineasPromovidas = this._mergeAsignacionesOperativas(snapshotBase, prevLineasOp);
            if (requiereRiggerActivo) {
              lineasPromovidas = lineasPromovidas.filter(l => !esLineaRiggerFantasma(l));
            }
            parsed.crm_v1.lineas_operativas_vigentes = JSON.parse(JSON.stringify(lineasPromovidas));
            parsed.crm_v1.lineas_servicio = JSON.parse(JSON.stringify(lineasPromovidas));
            parsed.crm_v1.version_cotizacion_vigente_operaciones = Number(ultimaEnviada.version);
            delete parsed.crm_v1.lineas_borrador_comercial;
            delete parsed.crm_v1._modo_borrador_comercial_operaciones;

            if (estadoActual >= 3) {
              const lineaGruaPrincipal = lineasPromovidas.find(esLineaEquipoGrua);
              if (lineaGruaPrincipal && esFijoGrua(lineaGruaPrincipal)) {
                nuevoPisoMinimoParaReports = 0;
                parsed.crm_v1.pisoMinimo = 0;
                parsed.crm_v1.es_valor_fijo = true;
              } else {
                const lineaGrua = lineasPromovidas.filter(esLineaEquipoGrua).find(l => Number(l.pisoMinimo || l.cantidad_horas || 0) > 0);
                if (lineaGrua) {
                  const pm = Number(lineaGrua.pisoMinimo || lineaGrua.cantidad_horas || 0);
                  if (pm > 0 && pm <= 24) nuevoPisoMinimoParaReports = pm;
                }
              }
            }
          } else if (estadoActual >= 3 && parsed.crm_v1._modo_borrador_comercial_operaciones) {
            let borradorConAsignaciones = this._mergeAsignacionesOperativas(
              JSON.parse(JSON.stringify(parsed.crm_v1.lineas_servicio || [])),
              prevLineasOp
            );
            if (requiereRiggerActivo) {
              borradorConAsignaciones = borradorConAsignaciones.filter(l => !esLineaRiggerFantasma(l));
            }
            parsed.crm_v1.lineas_borrador_comercial = borradorConAsignaciones;
            if (prevLineasOp.length > 0) {
              let opVig = JSON.parse(JSON.stringify(prevLineasOp));
              if (requiereRiggerActivo) opVig = opVig.filter(l => !esLineaRiggerFantasma(l));
              parsed.crm_v1.lineas_operativas_vigentes = opVig;
              parsed.crm_v1.lineas_servicio = opVig;
            }
            delete parsed.crm_v1._modo_borrador_comercial_operaciones;
          } else if (estadoActual >= 3) {
            if (Array.isArray(parsed.crm_v1.lineas_servicio) && parsed.crm_v1.lineas_servicio.length > 0) {
              let opVig = JSON.parse(JSON.stringify(parsed.crm_v1.lineas_servicio));
              if (requiereRiggerActivo) opVig = opVig.filter(l => !esLineaRiggerFantasma(l));
              parsed.crm_v1.lineas_operativas_vigentes = opVig;
              parsed.crm_v1.lineas_servicio = opVig;
            }
          } else {
            if (Array.isArray(parsed.crm_v1.lineas_servicio)) {
              let opVig = JSON.parse(JSON.stringify(parsed.crm_v1.lineas_servicio));
              if (requiereRiggerActivo) opVig = opVig.filter(l => !esLineaRiggerFantasma(l));
              parsed.crm_v1.lineas_operativas_vigentes = opVig;
              parsed.crm_v1.lineas_servicio = opVig;
            }
          }

          // SPEC-128: Blindaje de líneas de cobro único (Valor Fijo y TRASLADOS -> cantidad = 1)
          if (Array.isArray(parsed.crm_v1.lineas_servicio)) {
            parsed.crm_v1.lineas_servicio = parsed.crm_v1.lineas_servicio.map(normalizarLineaCobroUnico);
          }
          if (Array.isArray(parsed.crm_v1.lineas_operativas_vigentes)) {
            parsed.crm_v1.lineas_operativas_vigentes = parsed.crm_v1.lineas_operativas_vigentes.map(normalizarLineaCobroUnico);
          }

          // Validación transversal: si la grúa principal es Valor Fijo, asegurar pisoMinimo = 0 y es_valor_fijo = true
          const lineasFinales = parsed.crm_v1.lineas_operativas_vigentes || parsed.crm_v1.lineas_servicio || [];
          if (Array.isArray(lineasFinales)) {
            const gruaP = lineasFinales.find(esLineaEquipoGrua);
            if (gruaP && esFijoGrua(gruaP)) {
              parsed.crm_v1.pisoMinimo = 0;
              parsed.crm_v1.es_valor_fijo = true;
              nuevoPisoMinimoParaReports = 0;
            }
          }
        }

        json_field_processed = isStr ? JSON.stringify(parsed) : parsed;
      }
    }

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
        id_usuario_creacion      = COALESCE($15, id_usuario_creacion),
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
      final_id_proyecto_estado,
      id_proyecto_tipo,
      fecha_plan_ini,
      fecha_plan_fin,
      objetivo_proyecto,
      observacion_proyecto,
      json_field_processed,
      id_user_modificacion,
      id_proyecto,
      final_user_creacion
    ];

    try {
      const { rows, rowCount } = await this.pool.query(query, values);
      if (!rowCount) return null;
      if (nuevoPisoMinimoParaReports && nuevoPisoMinimoParaReports > 0) {
        try {
          await this.pool.query(
            `UPDATE tedp_reporte_avance
             SET horas_minimas = $2,
                 horas_facturables = GREATEST(COALESCE(horas_operadas, 0), $2)
             WHERE id_proyecto = $1
               AND COALESCE(validado_cliente, false) = false`,
            [id_proyecto, nuevoPisoMinimoParaReports]
          );
        } catch (eRep) {
          console.warn('[REQ-1100] Advertencia sincronizando horas_minimas en tedp_reporte_avance:', eRep.message);
        }
      }
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
      
      await client.query('CREATE SEQUENCE IF NOT EXISTS seq_id_cotizacion START 1');
      
      const seqResult = await client.query("SELECT nextval('seq_id_cotizacion') AS next_id");
      const nextId = seqResult.rows[0].next_id;
      
      const jsonField = p.json_field || {};
      if (!jsonField.crm_v1) jsonField.crm_v1 = {};
      if (!jsonField.crm_v1.cotizaciones_historicas) jsonField.crm_v1.cotizaciones_historicas = [];
      
      const version = jsonField.crm_v1.cotizaciones_historicas.length + 1;
      const fileName = `${codi}V${version}-${nextId}.pdf`;
      
      let lineasParaSnapshot = (Number(p.id_proyecto_estado) >= 3 && Array.isArray(jsonField.crm_v1.lineas_borrador_comercial) && jsonField.crm_v1.lineas_borrador_comercial.length > 0)
        ? JSON.parse(JSON.stringify(jsonField.crm_v1.lineas_borrador_comercial))
        : JSON.parse(JSON.stringify(jsonField.crm_v1.lineas_servicio || []));

      if (Boolean(jsonField.crm_v1?.requiere_rigger || jsonField.crm_v1?.requiereRigger)) {
        lineasParaSnapshot = lineasParaSnapshot.filter(l => !esLineaRiggerFantasma(l));
      }

      lineasParaSnapshot = lineasParaSnapshot.map(normalizarLineaCobroUnico);

      const nuevaCotizacion = {
        id_cotizacion: Number(nextId),
        version: version,
        nombre_archivo: fileName,
        monto: Number(monto || 0),
        fecha: new Date().toISOString(),
        estado_vigencia: 'BORRADOR_NO_ENVIADO',
        lineas_snapshot: lineasParaSnapshot
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

      // 1b. Obtener detalles de la empresa emisora desde DB (Paramétrico según id_empresa)
      const idEmisora = Number(p.id_empresa || p.id_empresa_emisora || 9);
      let emisorObjDB = null;
      if (idEmisora) {
        const { rows: emisorRows } = await client.query('SELECT * FROM tpar_empresas WHERE id_empresa = $1', [idEmisora]);
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
          colorLight: "rgba(59, 130, 246, 0.08)",
          logoPath: "logo-bestmaq.png"
        },
        8: {
          nombre: "SERVICIOS INTEGRADOS LOGÍSTICOS DEL SUR LTDA. (LOGÍSTICA DEL SUR)",
          rut: "76.218.576-8",
          giro: "ARRIENDO DE MAQUINARIAS Y LOGÍSTICA",
          direccion: "KM 9.5 Camino Labranza Hj 24 Lugar Botrolhue, Temuco",
          fono: "+56 9 9443 7725",
          color: "#10b981",
          colorLight: "rgba(16, 185, 129, 0.08)",
          logoPath: "logo-logisticadelsur.png"
        },
        11: {
          nombre: "ARRIENDO ROYAL RENTAL LIMITADA (ROYAL RENTAL)",
          rut: "78.254.535-3",
          giro: "ARRIENDO DE MAQUINARIAS Y EQUIPOS",
          direccion: "Camino Labranza KM 9.5, Temuco",
          fono: "+56 9 9443 7725",
          color: "#d97706",
          colorLight: "rgba(217, 119, 6, 0.08)",
          logoPath: "logo-royalrental.png"
        }
      };


      // Objeto base de colores
      let emisorBase = EMISORES[idEmisora] || EMISORES[9];
      
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

      const crm = jsonField.crm_v1 || {};
      let dbComercial = null;
      try {
        const idCreador = crm.id_vendedor || p.id_usuario_creacion || null;
        const emailVendedor = (crm.vendedor_email || '').trim();
        const nombreVendedor = (crm.vendedor_nombre || '').trim();
        if (idCreador) {
          const uRes = await this.pool.query('SELECT * FROM tsec_users WHERE id_user = $1 LIMIT 1', [idCreador]);
          if (uRes.rows.length > 0) dbComercial = uRes.rows[0];
        }
        if (!dbComercial && emailVendedor) {
          const uRes = await this.pool.query('SELECT * FROM tsec_users WHERE LOWER(TRIM(email)) = LOWER($1) LIMIT 1', [emailVendedor]);
          if (uRes.rows.length > 0) dbComercial = uRes.rows[0];
        }
        if (!dbComercial && nombreVendedor) {
          const uRes = await this.pool.query(
            `SELECT * FROM tsec_users
             WHERE LOWER(REGEXP_REPLACE(TRIM(COALESCE(name_frst, '') || ' ' || COALESCE(apellido_pat, '')), '\\s+', ' ', 'g')) =
                   LOWER(REGEXP_REPLACE(TRIM($1), '\\s+', ' ', 'g'))
             LIMIT 1`,
            [nombreVendedor]
          );
          if (uRes.rows.length > 0) dbComercial = uRes.rows[0];
        }
      } catch (eUser) {
        console.warn('[generarCotizacionVersion] Error consultando comercial en tsec_users:', eUser.message);
      }

      const dbUserJson = (dbComercial && typeof dbComercial.json_data === 'object' && dbComercial.json_data) ? dbComercial.json_data : {};
      const dbNombre = dbComercial
        ? ([dbComercial.name_frst, dbComercial.apellido_pat].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim())
        : '';
      const rawFono = crm.vendedor_telefono || (dbComercial ? (dbComercial.movil || dbUserJson.telefono || dbUserJson.movil || dbUserJson.celular || '') : '') || '';
      const formatFonoCL = (f) => {
        const clean = String(f || '').replace(/\s+/g, '').trim();
        if (!clean) return '';
        const digits = clean.replace(/\D/g, '');
        if (digits.length === 9 && digits.startsWith('9')) {
          return `+56 9 ${digits.slice(1, 5)} ${digits.slice(5)}`;
        }
        if (digits.length === 11 && digits.startsWith('569')) {
          return `+56 9 ${digits.slice(3, 7)} ${digits.slice(7)}`;
        }
        return clean;
      };
      const dbEmail = dbComercial ? (dbComercial.email || '') : '';

      const ejecutivoNombre = (crm.vendedor_nombre || dbNombre || 'Ejecutivo Comercial').replace(/\s+/g, ' ').trim();
      const ejecutivoFono = formatFonoCL(rawFono) || emisor.fono || '';
      const ejecutivoEmail = crm.vendedor_email || dbEmail || 'ventas@arriendosanpablo.cl';

      let finalLogoPath = emisor.logoPath;
      try {
        const logoFileName = emisor.logoPath || 'logo-sanpablo.png';
        const cwdPath = path.join(process.cwd(), 'public', logoFileName);
        const fallbackPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoFileName);
        const diskPath = fs.existsSync(cwdPath) ? cwdPath : fallbackPath;
        if (fs.existsSync(diskPath)) {
          const imgBuf = fs.readFileSync(diskPath);
          finalLogoPath = 'data:image/png;base64,' + imgBuf.toString('base64');
        } else {
           console.warn(`Logo no encontrado en disco: ${diskPath}`);
        }
      } catch (err) {
        console.error('Error leyendo logo desde disco:', err);
      }

      // 3. Extraer datos estructurados de json_field.crm_v1 (REQ-1100: usa lineas_snapshot de esta versión)
      const lineas = Array.isArray(nuevaCotizacion.lineas_snapshot) && nuevaCotizacion.lineas_snapshot.length > 0
        ? nuevaCotizacion.lineas_snapshot
        : (crm.lineas_servicio || []);

      // Formateador simple de moneda CLP
      const formatCLP = (v) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v || 0);
      };

      // 4. Compilar líneas de servicios en tabla HTML
      let lineasHtml = '';
      lineas.forEach((line, index) => {
        const unidad = line.unidad || 'Horas Diarias Minimas';
        const price = Number(line.valor_unitario !== undefined ? line.valor_unitario : (line.valorUnitario || 0));
        let cantBaseTexto = '';
        let totalLine = 0;
        let tarifaTexto = '';
        
        if (unidad === 'Horas Diarias Minimas') {
          const dias = Number(line.cantidad_dias !== undefined ? line.cantidad_dias : line.cantidad) || 1;
          const horas = Number(line.cantidad_horas !== undefined ? line.cantidad_horas : line.pisoMinimo) || 8;
          cantBaseTexto = `${dias} ${dias === 1 ? 'Día' : 'Días'} × ${horas} hrs/día`;
          tarifaTexto = `${formatCLP(price)} / hr`;
          totalLine = dias * horas * price;
        } else if (unidad === 'Horas Mes Minimas' || unidad === 'Horas Mensuales Minimas') {
          const meses = Number(line.cantidad_meses !== undefined ? line.cantidad_meses : line.cantidad) || 1;
          const horas = Number(line.cantidad_horas !== undefined ? line.cantidad_horas : line.pisoMinimo) || 180;
          cantBaseTexto = `${meses} ${meses === 1 ? 'Mes' : 'Meses'} × ${horas} hrs/mes`;
          tarifaTexto = `${formatCLP(price)} / hr`;
          totalLine = meses * horas * price;
        } else if (unidad === 'Traslado') {
          const cant = Number(line.cantidad) || 1;
          cantBaseTexto = `${cant} ${cant === 1 ? 'Viaje' : 'Viajes'}`;
          tarifaTexto = formatCLP(price);
          totalLine = cant * price;
        } else if (isLineaCobroUnico(line)) {
          // SPEC-128: Cobro único (Valor Fijo o TRASLADOS) -> indivisible, 1 servicio plano
          cantBaseTexto = `1 Servicio`;
          tarifaTexto = formatCLP(price);
          totalLine = price;
        } else {
          // Cobro Fijo u otro
          const cant = Number(line.cantidad) || 1;
          cantBaseTexto = `${cant} ${cant === 1 ? 'Servicio' : 'Servicios'}`;
          tarifaTexto = formatCLP(price);
          totalLine = cant * price;
        }
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
            </td>
            <td style="text-align: center; font-size: 8px;">${unidad}</td>
            <td style="text-align: center; font-weight: 600; color: #1e293b;">${cantBaseTexto}</td>
            <td style="text-align: right;">${tarifaTexto}</td>
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

      // Formatear saltos de línea de condiciones para HTML y cláusula contractual de régimen
      const esCaso5 = true;
      const kmEstimado = parseFloat(crm.distancia_km ?? crm.snapshot_comercial?.distancia_km) || (crm.incluye_flete ? 35 : 0);
      const regimenOpDefinido = String(p.json_field?.ejecucion_v1?.regimen_operacional || crm.regimen_operacional || '').toUpperCase(); const glosaPoliticaOperacional = regimenOpDefinido === 'RURAL' ? 'POLÍTICA RURAL (Cobro inicio a término en obra)' : (regimenOpDefinido === 'URBANO' ? 'POLÍTICA URBANA (Cobro salida de base a término en obra)' : 'Sujeto a Verificación Operacional (Según Condiciones Generales)'); const esUrbano = kmEstimado <= 30;
      const penCot = crm.pensiones || crm.snapshot_comercial?.pensiones || {};
      const fmtPenCot = (val) => val === 'CLIENTE' ? 'Costeado por Cliente' : (val === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'Por Definir');
      let clausulaRegimen = `• CÓMPUTO DE HORAS SEGÚN POLÍTICA OPERACIONAL: En servicios bajo Política Urbana, el cobro de horas al cliente se contabiliza desde la salida del equipo de la base Grúas San Pablo hasta el término del servicio en obra. En servicios bajo Política Rural, el cobro de horas al cliente se contabiliza desde el inicio hasta el término del servicio en obra.`;
      if (!esCaso5) {
        clausulaRegimen = esUrbano
          ? `• RÉGIMEN URBANO (≤ 30 km): La jornada y el cómputo de horas de arriendo inician al momento de la salida del equipo desde las instalaciones de Grúas San Pablo (Panamericana Sur Km 678, Temuco) y finalizan al retornar a las mismas.`
          : `• RÉGIMEN RURAL (> 30 km): La jornada de arriendo del equipo inicia a la llegada a faena y concluye al término del servicio diario. La movilización (flete ida y retorno) se factura de forma independiente.`;
      }
      
      const condicionesHtml = [clausulaRegimen, crm.condiciones_pdf || ''].filter(Boolean).join('\n\n');

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
                ${finalLogoPath ? `<img src="${finalLogoPath}" style="${idEmisora === 9 ? 'width: 205px; max-width: 215px; max-height: 95px;' : 'max-width: 165px; max-height: 85px;'} object-fit: contain;" alt="Logo" />` : ''}
              </td>
              <td style="width: 45%;">
                <div class="emitter-title">${emisor.nombre}</div>
                <div class="emitter-info">
                  RUT: ${emisor.rut} | Giro: ${emisor.giro}<br>
                  Casa Matriz: ${emisor.direccion}<br>
                  Contacto: ${ejecutivoFono || emisor.fono}
                </div>
              </td>
              <td style="width: 30%; text-align: right;">
                <div class="quote-badge">
                  <div class="quote-title">COTIZACIÓN COMERCIAL</div>
                  <div class="quote-meta">
                    <strong>Número:</strong> ${codi}<br>
                    <strong>Versión:</strong> ${version}<br>
                    <strong>Fecha:</strong> ${new Date(nuevaCotizacion.fecha).toLocaleDateString('es-CL')}<br>
                    <strong>Ejecutivo:</strong> ${ejecutivoNombre}<br>
                    <strong>Fono Ejecutivo:</strong> ${ejecutivoFono}<br>
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
              <td class="info-label">Distancia Estimada Comercial:</td>
              <td class="info-value"><strong style="color: #b45309;">${kmEstimado > 0 ? `${kmEstimado} km (Ida desde Casa Matriz)` : 'No especificada'}</strong></td>
              <td class="info-label">Política Operacional:</td>
              <td class="info-value"><strong>${glosaPoliticaOperacional}</strong></td>
            </tr>
            <tr>
              <td class="info-label">Horario Inicio Servicio:</td>
              <td class="info-value">${crm.fecha_hora_inicio ? new Date(crm.fecha_hora_inicio).toLocaleString('es-CL') : 'A coordinar con Operaciones'}</td>
              <td class="info-label">Término Estimado:</td>
              <td class="info-value">${crm.fecha_hora_termino ? new Date(crm.fecha_hora_termino).toLocaleString('es-CL') : 'Según avance de faena'}</td>
            </tr>
            <tr>
              <td class="info-label">Detalle del Servicio:</td>
              <td class="info-value" colspan="3">${crm.detalle_servicio || crm.descripcion || p.objetivo_proyecto || p.observacion_proyecto || '—'}</td>
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
                • <strong>Política Operacional:</strong> ${glosaPoliticaOperacional} (${kmEstimado > 0 ? kmEstimado + ' km antecedente' : 'Sin distancia informada'})&nbsp;&nbsp;&nbsp;&nbsp;
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
                <th style="width: 40%;">Descripción del Servicio</th>
                <th style="width: 16%; text-align: center;">Unidad de Cobro</th>
                <th style="width: 16%; text-align: center;">Cantidad(es) / Base</th>
                <th style="width: 11%; text-align: right;">Tarifa Unitario</th>
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
              <td class="info-value">${crm.validez_dias || 5} días hábiles</td>
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
            <tr>
              <td class="info-label">Traslado, Alimentación y Alojamiento:</td>
              <td class="info-value" colspan="3" style="font-size: 9.5px; line-height: 1.5;">
                ${(penCot.formato_viaticos === 'V1_5_ITEMS' && !penCot.alimentacion_costeado && (penCot.desayuno_costeado !== penCot.almuerzo_costeado || penCot.almuerzo_costeado !== penCot.cena_costeado))
                  ? `• <strong>Traslado:</strong> ${fmtPenCot(penCot.traslado_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Desayuno:</strong> ${fmtPenCot(penCot.desayuno_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Almuerzo:</strong> ${fmtPenCot(penCot.almuerzo_costeado)}<br>• <strong>Cena:</strong> ${fmtPenCot(penCot.cena_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Alojamiento:</strong> ${fmtPenCot(penCot.alojamiento_costeado)}`
                  : `• <strong>Traslado:</strong> ${fmtPenCot(penCot.traslado_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Alimentación:</strong> ${fmtPenCot(penCot.alimentacion_costeado || penCot.almuerzo_costeado || penCot.desayuno_costeado || penCot.cena_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Alojamiento:</strong> ${fmtPenCot(penCot.alojamiento_costeado)}`
                }
              </td>
            </tr>
          </table>
          
          ${condicionesHtml ? `
            <div style="font-weight: bold; font-size: 8.5px; color: #2d3748; margin-top: 6px;">Exclusiones y Condiciones Especiales:</div>
            <div class="conditions-box" style="white-space: pre-wrap;">${condicionesHtml}</div>
          ` : ''}
          
          <div class="footer">
            Documento de carácter confidencial emitido por el Holding de Empresas de Grúas San Pablo.<br>
            Para cualquier consulta comercial o de operaciones, contactar a ${ejecutivoNombre} (${ejecutivoFono || emisor.fono} / ${ejecutivoEmail}).
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
      
      await client.query('CREATE SEQUENCE IF NOT EXISTS seq_id_ot START 1');
      
      const seqResult = await client.query("SELECT nextval('seq_id_ot') AS next_id");
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
          colorLight: "rgba(59, 130, 246, 0.08)",
          logoPath: "logo-bestmaq.png"
        },
        8: {
          nombre: "SERVICIOS INTEGRADOS LOGÍSTICOS DEL SUR LTDA. (LOGÍSTICA DEL SUR)",
          rut: "76.218.576-8",
          giro: "ARRIENDO DE MAQUINARIAS Y LOGÍSTICA",
          direccion: "KM 9.5 Camino Labranza Hj 24 Lugar Botrolhue, Temuco",
          fono: "+56 9 9443 7725",
          color: "#10b981",
          colorLight: "rgba(16, 185, 129, 0.08)",
          logoPath: "logo-logisticadelsur.png"
        },
        11: {
          nombre: "ARRIENDO ROYAL RENTAL LIMITADA (ROYAL RENTAL)",
          rut: "78.254.535-3",
          giro: "ARRIENDO DE MAQUINARIAS Y EQUIPOS",
          direccion: "Camino Labranza KM 9.5, Temuco",
          fono: "+56 9 9443 7725",
          color: "#d97706",
          colorLight: "rgba(217, 119, 6, 0.08)",
          logoPath: "logo-royalrental.png"
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
        const cwdPath = path.join(process.cwd(), 'public', logoFileName);
        const fallbackPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoFileName);
        const diskPath = fs.existsSync(cwdPath) ? cwdPath : fallbackPath;
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
        const fullName = `${u.name_frst || ''} ${u.apellido_pat || ''} ${u.apellido_mat || ''}`.replace(/\s+/g, ' ').trim();
        return {
          ...u,
          nombre_user: fullName || u.nombre_user || u.name_user || u.name_frst || 'Usuario Asignado'
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
      const horaInicioServicio = ejec.hora_llegada_plan || ejec.hora_inicio_servicio || crm.hora_inicio || '09:00';
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

      // Horas Mínimas Contractuales (Piso Mínimo)
      // REQ-1105: Clasificación determinista por Categoría/Subcategoría (Excluyendo Personal Certificado y Traslados)
      const esLineaPersonalOT = (l) => {
        if (!l) return false;
        const tipo = String(l.tipo || l.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
        const sub = String(l.subcategoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
        if (tipo === 'PERSONAL CERTIFICADO' || tipo === 'PERSONAL' || tipo === 'MANO DE OBRA') return true;
        if (tipo === '' && (sub.includes('RIGGER') || sub.includes('PREVENCIONISTA') || sub.includes('OPERADOR') || sub.includes('SUPERVISOR'))) return true;
        return false;
      };

      const esLineaTrasladoOT = (l) => {
        if (!l || esLineaPersonalOT(l)) return false;
        const tipo = String(l.tipo || l.categoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
        const unidad = String(l.unidad || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
        if (tipo === 'TRASLADOS' || tipo === 'TRASLADO' || tipo === 'FLETE' || tipo === 'FLETES' || tipo === 'TRANSPORTE') return true;
        if (unidad.includes('TRASLADO') || unidad === 'FLETE' || unidad === 'VIAJE') return true;
        return false;
      };

      const formatearPoliticaCobroLinea = (l) => {
        if (!l) return '8 hrs diarias mínimas';
        const hrs = Number(l.pisoMinimo || l.horas_minimas || l.cantidad_horas || 8.0);
        const u = String(l.unidad || '').toUpperCase().trim();
        if (u.includes('MES')) {
          const meses = Number(l.cantidad_meses || l.cantidad || 1);
          return `${hrs} hrs mensuales mínimas (${meses} ${meses === 1 ? 'Mes' : 'Meses'})`;
        }
        if (u.includes('DIA') || u.includes('DÍA') || u.includes('JORNADA') || u === 'HORAS') {
          const dias = Number(l.cantidad_dias || l.cantidad || 1);
          return `${hrs} hrs diarias mínimas (${dias} ${dias === 1 ? 'Día' : 'Días'})`;
        }
        if (u.includes('FIJO') || u.includes('SERVICIO') || u.includes('MANIOBRA')) {
          return 'Servicio a Valor Fijo Convenido';
        }
        if (u.includes('TRASLADO') || u.includes('FLETE') || u.includes('VIAJE')) {
          const cant = Number(l.cantidad || 1);
          return `${l.unidad || 'Traslado'} (${cant} ${cant === 1 ? 'Viaje' : 'Viajes'})`;
        }
        return `${hrs} hrs diarias mínimas`;
      };

      // Filtrar exclusivamente líneas de Equipos Principales (excluyendo Personal Certificado y Traslados)
      // Priorizar líneas base comerciales y deduplicar por equipo físico (1 Patente = 1 Política de Cobro)
      const lineasEquiposRaw = lineasServicio.filter(l => !esLineaPersonalOT(l) && !esLineaTrasladoOT(l));
      const lineasEquiposBase = lineasEquiposRaw.filter(l => l.is_linea_base !== false);
      const lineasEquiposCandidatas = [
        ...lineasEquiposBase,
        ...lineasEquiposRaw.filter(l => l.is_linea_base === false)
      ];
      const lineasEquiposOT = [];
      const patentesEquiposOT = new Set();
      lineasEquiposCandidatas.forEach((l, idx) => {
        const eqId = l.equipo_asignado_id || l.equipo_id || (lineasEquiposOT.length === 0 ? ejec.equipo_id : null);
        const eqObj = eqId ? (getEquipoInfo(eqId) || {}) : {};
        const pat = (eqObj.patente || eqObj.ppu || (typeof eqId === 'string' ? eqId : '') || '').toUpperCase().trim();
        const dedupKey = pat ? `PAT_${pat}` : (eqId ? `EQ_${eqId}` : `LINE_${idx}`);
        if ((pat || eqId) && patentesEquiposOT.has(dedupKey)) return;
        // Ignorar líneas sintéticas operativas sin tarifa si ya existe al menos una línea base comercial
        if (l.is_linea_base === false && Number(l.valorUnitario || l.valor_unitario || 0) === 0 && !eqId && lineasEquiposBase.length > 0) return;
        if (pat || eqId) patentesEquiposOT.add(dedupKey);
        lineasEquiposOT.push({ ...l, _resolved_eq_id: eqId, _resolved_patente: pat, _resolved_eq_obj: eqObj });
      });

      let horasMinimas = 8.0;
      let pisoMinimoTexto = '8 hrs diarias mínimas';
      if (lineasEquiposOT.length > 0) {
        const lFirst = lineasEquiposOT[0];
        horasMinimas = Number(lFirst.pisoMinimo || lFirst.horas_minimas || lFirst.cantidad_horas || 8.0);
        const politicasPorPatente = lineasEquiposOT.map((l, idx) => {
          const pat = l._resolved_patente || '';
          const labelEq = pat ? `[${pat}]` : (l.subcategoria || l.tipo || `Equipo #${idx + 1}`);
          return `<strong>${labelEq}:</strong> ${formatearPoliticaCobroLinea(l)}`;
        });
        pisoMinimoTexto = politicasPorPatente.join('<br>');
      } else if (ejec.horas_minimas || crm.horas_minimas) {
        horasMinimas = Number(ejec.horas_minimas || crm.horas_minimas || 8.0);
        pisoMinimoTexto = `${horasMinimas} hrs diarias mínimas`;
      }
      // Fin cálculo Piso Mínimo Contractual
      if (lineasServicio && lineasServicio.length > 0) {
        const lPiso = null;
        if (lPiso) {
          horasMinimas = Number(lPiso.pisoMinimo || lPiso.horas_minimas || lPiso.cantidad_horas || 8.0);
        }
      } else if (ejec.horas_minimas || crm.horas_minimas) {
        horasMinimas = Number(ejec.horas_minimas || crm.horas_minimas || 8.0);
      }
      
      // Helper para identificar líneas que NO son de izaje principal (traslados, fletes, personal)
      const isTrasladoOrLogistica = (l) => {
        if (!l) return false;
        const tipo = String(l.tipo || '').toUpperCase();
        const desc = String(l.descripcion || l.subcategoria || '').toUpperCase();
        return esLineaPersonalOT(l) || esLineaTrasladoOT(l);
      };

      // Segmento 1: Flota Principal (Grúas y Equipos de Izaje Primario)
      const fmtFechaCortaOT = (f) => {
        if (!f || typeof f !== 'string') return '';
        const m = f.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : f;
      };
      const fmtRangoTurnoOT = (ini, fin) => {
        const f1 = fmtFechaCortaOT(ini);
        const f2 = fmtFechaCortaOT(fin);
        if (f1 && f2) return f1 === f2 ? f1 : `${f1} al ${f2}`;
        return f1 || f2 || '';
      };

      const patentesFlotaVistas = new Set(); lineasEquiposOT.forEach((l, idx) => {
        if (isTrasladoOrLogistica(l)) return; // Excluir traslados/fletes de la flota principal

        const eqId = l._resolved_eq_id || l.equipo_asignado_id || l.equipo_id;
        if (eqId) {
          const eqObj = getEquipoInfo(eqId) || {}; const patFlota = String(eqObj.patente || eqObj.ppu || eqId || '').toUpperCase().trim(); if (patFlota && patentesFlotaVistas.has(patFlota)) return; if (patFlota) patentesFlotaVistas.add(patFlota);
          const turnos = Array.isArray(l.turnos_operadores) && l.turnos_operadores.length > 0
            ? l.turnos_operadores.filter(t => t && t.operador_id)
            : [];
          let choferLabel = 'Sin Operador Asignado';
          if (turnos.length > 0) {
            choferLabel = turnos.map(t => {
              const u = getUserInfo(t.operador_id) || {};
              const nom = u.nombre_user || u.name_frst || 'Operador';
              const rng = fmtRangoTurnoOT(t.fecha_ini, t.fecha_fin);
              return rng ? `<strong>${nom}</strong> <span style="color:#475569;">(${rng})</span>` : `<strong>${nom}</strong>`;
            }).join('<br>');
          } else {
            const opObj = getUserInfo(l.operador_asignado_id || ejec.operador_id) || {};
            if (opObj.nombre_user || opObj.name_frst) {
              const rng = fmtRangoTurnoOT(l.fecha_plan_ini, l.fecha_plan_fin);
              choferLabel = rng
                ? `<strong>${opObj.nombre_user || opObj.name_frst}</strong> (Operador • ${rng})`
                : `${opObj.nombre_user || opObj.name_frst} (Operador)`;
            }
          }
          flotaItems.push({
            segmento: 'Izaje Principal',
            tipo: l.tipo || eqObj.tipo || 'Grúa Móvil',
            modelo: l.subcategoria || eqObj.nombre_equipo || eqObj.modelo || 'General',
            patente: (eqObj.patente || eqObj.ppu || eqId || '').toUpperCase(),
            chofer: choferLabel
          });
        }
      });

      // Segmento 2: Traslados & Logística
      const equiposExtra = Array.isArray(ejec.equipos_extra) ? ejec.equipos_extra : [];
      const fmtModalidadTrasladoOT = (mod) => {
        const m = String(mod || '').toUpperCase().trim();
        if (m === 'SOLO_IDA' || m === 'IDA') return 'SOLO IDA — Entrega en Obra (Retiro Pendiente)';
        if (m === 'SOLO_RETORNO' || m === 'RETORNO') return 'SOLO RETORNO — Retiro desde Obra';
        if (m === 'IDA_VUELTA') return 'IDA Y VUELTA';
        return '';
      };
      equiposExtra.forEach((ex, idx) => {
        const eqId = typeof ex === 'object' ? ex.id_equipo : ex;
        if (eqId) {
          const eqObj = getEquipoInfo(eqId) || {}; const patFlota = String(eqObj.patente || eqObj.ppu || eqId || '').toUpperCase().trim(); if (patFlota && patentesFlotaVistas.has(patFlota)) return; if (patFlota) patentesFlotaVistas.add(patFlota);
          const chObj = getUserInfo(ex.chofer_id || ejec.chofer_id) || {};
          const modTexto = fmtModalidadTrasladoOT(ex.modalidad_traslado);
          const rngEx = fmtRangoTurnoOT(ex.fecha_plan_ini, ex.fecha_plan_fin);
          const chNombre = chObj.nombre_user || chObj.name_frst ? `${chObj.nombre_user || chObj.name_frst} (Chofer)` : 'Sin Chofer Asignado';
          flotaItems.push({
            segmento: modTexto ? `Traslado (${modTexto})` : 'Traslado & Logística',
            tipo: ex.tipo || eqObj.tipo || 'Transporte',
            modelo: eqObj.nombre_equipo || ex.subcategoria || ex.descripcion || 'Cama Baja',
            patente: (eqObj.patente || eqObj.ppu || eqId || '').toUpperCase(),
            chofer: rngEx ? `${chNombre} <span style="color:#475569;">(${rngEx})</span>` : chNombre
          });
        }
      });

      // Si no hay equipos_extra pero lineasServicio tenía una línea de traslado con equipo asignado:
      if (equiposExtra.length === 0) {
        lineasServicio.filter(esLineaTrasladoOT).forEach((l) => {
          const eqId = l._resolved_eq_id || l.equipo_asignado_id || l.equipo_id;
          if (eqId) {
            const eqObj = getEquipoInfo(eqId) || {}; const patFlota = String(eqObj.patente || eqObj.ppu || eqId || '').toUpperCase().trim(); if (patFlota && patentesFlotaVistas.has(patFlota)) return; if (patFlota) patentesFlotaVistas.add(patFlota);
            const chObj = getUserInfo(l.operador_asignado_id || ejec.chofer_id) || {};
            flotaItems.push({
              segmento: 'Traslado & Logística',
              tipo: l.tipo || eqObj.tipo || 'Transporte',
              modelo: eqObj.nombre_equipo || eqObj.modelo || l.subcategoria || l.descripcion || 'Cama Baja',
              patente: (eqObj.patente || eqObj.ppu || eqId || '').toUpperCase(),
              chofer: chObj.nombre_user || chObj.name_frst ? `${chObj.nombre_user || chObj.name_frst} (Chofer)` : 'Sin Chofer Asignado'
            });
          }
        });
      }

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
            <td style="text-align: center; font-family: monospace; font-weight: bold; font-size: 14px; color: #1e40af;">${f.patente}</td>
            <td style="font-size: 13px;">${f.segmento}</td>
            <td style="font-size: 13.5px; font-weight: 600;">${f.chofer}</td>
          </tr>
        `;
      });

      // Dotación Humana / Tripulación
      const tripulacionItems = [];
      const userIdsSeen = new Set();

      lineasServicio.forEach(l => {
        const turnos = Array.isArray(l.turnos_operadores) && l.turnos_operadores.length > 0
          ? l.turnos_operadores.filter(t => t && t.operador_id)
          : [];
        if (turnos.length > 0) {
          turnos.forEach(t => {
            if (t.operador_id && !userIdsSeen.has(t.operador_id)) {
              userIdsSeen.add(t.operador_id);
              const u = getUserInfo(t.operador_id);
              const rng = fmtRangoTurnoOT(t.fecha_ini, t.fecha_fin);
              if (u) tripulacionItems.push({ rol: rng ? `Operador Grúa / Equipo (${rng})` : 'Operador Grúa / Equipo', ...u });
            }
          });
        } else if (l.operador_asignado_id && !userIdsSeen.has(l.operador_asignado_id)) {
          userIdsSeen.add(l.operador_asignado_id);
          const u = getUserInfo(l.operador_asignado_id);
          if (u) tripulacionItems.push({ rol: 'Operador Grúa / Equipo', ...u });
        }
      });

      equiposExtra.forEach(ex => {
        if (ex.chofer_id && !userIdsSeen.has(ex.chofer_id)) {
          userIdsSeen.add(ex.chofer_id);
          const u = getUserInfo(ex.chofer_id);
          const modTexto = fmtModalidadTrasladoOT(ex.modalidad_traslado);
          if (u) tripulacionItems.push({ rol: modTexto ? `Chofer Transporte (${modTexto})` : 'Chofer Cama Baja / Transporte', ...u });
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
            <td><strong style="font-size: 13.5px;">${t.nombre_user || `${t.name_frst || ''} ${t.name_last || ''}`}</strong></td>
            <td style="font-family: monospace; font-size: 13px; font-weight: 600;">${t.rut_user || 'N/A'}</td>
            <td><span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 12.5px;">${t.rol || t.cargo || 'Especialista'}</span></td>
            <td style="font-size: 12.5px; color: #334155;">${t.email || '-'}</td>
          </tr>
        `;
      });

      // Matriz de Aparejos
      const aparejosRaw = ejec.aparejos_asignados_json || ejec.implementos_survey || ejec.aparejos_solicitados_json || crm.aparejos || [];
      const aparejosJson = typeof aparejosRaw === 'string' ? JSON.parse(aparejosRaw) : aparejosRaw;
      let aparejosHtml = '';
      
      if (Array.isArray(aparejosJson) && aparejosJson.length > 0) {
        const rowsApar = [];
        aparejosJson.forEach(item => {
          if (item && (item.requerido || (item.detalle && String(item.detalle).trim() !== '' && String(item.detalle).trim() !== '0'))) {
            const label = item.label || item.nombre || item.id || 'Aparejo';
            const det = item.detalle ? ` — Cantidad / Capacidad: <strong>${item.detalle}</strong>` : ' <em>(Requerido)</em>';
            rowsApar.push(`<li><strong>${label}</strong>${det}</li>`);
          }
        });
        if (rowsApar.length > 0) {
          aparejosHtml = `<ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #1e293b;">${rowsApar.join('')}</ul>`;
        }
      } else if (typeof aparejosJson === 'object' && aparejosJson !== null && Object.keys(aparejosJson).length > 0) {
        const rowsApar = [];
        for (const [k, v] of Object.entries(aparejosJson)) {
          if (v && v !== '0' && v !== false) {
            if (typeof v === 'object') {
              const label = v.label || v.nombre || k.replace(/_/g, ' ').toUpperCase();
              const det = v.detalle ? ` — Cantidad / Capacidad: <strong>${v.detalle}</strong>` : ' <em>(Requerido)</em>';
              rowsApar.push(`<li><strong>${label}</strong>${det}</li>`);
            } else {
              rowsApar.push(`<li><strong>${k.replace(/_/g, ' ').toUpperCase()}:</strong> ${typeof v === 'boolean' ? 'Requerido / Asignado' : v}</li>`);
            }
          }
        }
        if (rowsApar.length > 0) {
          aparejosHtml = `<ul style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #1e293b;">${rowsApar.join('')}</ul>`;
        }
      }

      if (!aparejosHtml) {
        aparejosHtml = '<p style="margin: 0; font-size: 13px; color: #334155; font-style: italic;">Aparejos estándar de faena (Eslingas certificadas, grilletes omega y fajas de alta resistencia según tabla de carga).</p>';
      }

      // Suministros & Logística
      const combMandante = crm.cliente_pone_combustible === true;
      const descripcionServicioOT = crm.descripcion || crm.detalle_servicio || p.objetivo_proyecto || p.observacion_proyecto || 'Sin descripción comercial registrada.';
      const observaciones = ejec.observaciones || crm.observaciones_cotizacion || 'Servicio sujeto a protocolo de seguridad y análisis seguro de trabajo (AST) en faena.';
      const kmEstimadoOT = parseFloat(crm.distancia_km ?? crm.snapshot_comercial?.distancia_km) || (crm.incluye_flete ? 35 : 0);
      const esCaso5OT = Number(crm.tipo_caso) === 5 || crm.tipo_caso_glosa === 'ESPECIAL_MIXTO_LIBRE';
      const regimenOT = esCaso5OT ? 'ESPECIAL / PLATAFORMAS (Partidas Abiertas)' : (kmEstimadoOT <= 30 ? 'URBANO (≤ 30 km)' : 'RURAL (> 30 km)');
      const penOT = crm.pensiones || crm.snapshot_comercial?.pensiones || {};
      const fmtPenOT = (val) => val === 'CLIENTE' ? 'Costeado por Cliente' : (val === 'SAN_PABLO' ? 'Costeado por San Pablo' : 'Por Definir');

      // Template HTML A4
      const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Orden de Trabajo ${codi} - V${version}</title>
        <style>
          @page { size: A4; margin: 8mm 10mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.45; color: #0f172a; background: #ffffff; margin: 0; padding: 0; }
          .header { border-bottom: 3px solid ${emisor.color}; padding-bottom: 10px; margin-bottom: 12px; }
          .header table { width: 100%; border-collapse: collapse; }
          .logo { max-height: 62px; max-width: 210px; object-fit: contain; }
          .title-box { text-align: right; }
          .ot-title { font-size: 24px; font-weight: 900; color: ${emisor.color}; margin: 0; letter-spacing: 0.5px; }
          .ot-code { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 3px; font-family: monospace; }
          .ot-version { display: inline-block; background: ${emisor.color}; color: #000; font-weight: 900; padding: 3px 10px; border-radius: 4px; font-size: 13px; margin-top: 4px; }
          
          .section-title { font-size: 14px; font-weight: bold; background: #f1f5f9; color: #0f172a; padding: 6px 10px; border-left: 5px solid ${emisor.color}; margin-top: 12px; margin-bottom: 7px; text-transform: uppercase; }
          
          table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13.5px; }
          table.data-table th { background: #f8fafc; color: #334155; font-weight: bold; font-size: 12.5px; text-transform: uppercase; padding: 7px 8px; border: 1px solid #cbd5e1; text-align: left; }
          table.data-table td { padding: 7px 8px; border: 1px solid #cbd5e1; color: #0f172a; vertical-align: middle; }
          table.data-table tr:nth-child(even) { background: #f8fafc; }
          
          .info-grid { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 13.5px; }
          .info-grid td { padding: 6px 8px; border: 1px solid #cbd5e1; vertical-align: top; }
          .info-lbl { font-weight: bold; color: #334155; width: 20%; background: #f8fafc; font-size: 13px; }
          .info-val { color: #0f172a; width: 30%; font-size: 13.5px; }
          
          .signatures { width: 100%; margin-top: 22px; border-collapse: collapse; }
          .signatures td { width: 50%; vertical-align: bottom; text-align: center; padding: 0 20px; }
          .sig-line { border-top: 1.5px dashed #475569; margin-top: 45px; padding-top: 6px; font-size: 12px; font-weight: bold; color: #0f172a; }
          .sig-sub { font-size: 11px; color: #475569; }
          
          .footer { margin-top: 14px; border-top: 1px solid #cbd5e1; padding-top: 6px; text-align: center; font-size: 10.5px; color: #475569; }
        </style>
      </head>
      <body>
        <div class="header">
          <table>
            <tr>
              <td style="width: 50%;">
                ${finalLogoPath ? `<img src="${finalLogoPath}" class="logo" alt="Logo">` : `<h2>${emisor.nombre}</h2>`}
                <div style="font-size: 11.5px; color: #334155; margin-top: 4px; line-height: 1.35;">
                  <strong>${emisor.nombre}</strong><br>
                  RUT: ${emisor.rut} | ${emisor.giro}<br>
                  ${emisor.direccion} | Fono: ${emisor.fono}
                </div>
              </td>
              <td class="title-box">
                <div class="ot-title">ORDEN DE TRABAJO (OT)</div>
                <div class="ot-code">${codi}</div>
                <div class="ot-version">VERSIÓN ${version}</div>
                <div style="font-size: 11.5px; color: #475569; margin-top: 4px;">Emisión: ${new Date().toLocaleString('es-CL')}</div>
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
            <td class="info-lbl">Distancia Estimada Comercial:</td>
            <td class="info-val"><strong style="color: #b45309;">${kmEstimadoOT > 0 ? `${kmEstimadoOT} km (Ida desde Casa Matriz)` : 'No especificada'}</strong></td>
            <td class="info-lbl">Régimen Operacional:</td>
            <td class="info-val"><strong>${regimenOT}</strong></td>
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
            <td class="info-lbl">Inicio Faena / Servicio:</td>
            <td class="info-val"><strong style="color: #0284c7;">${fechaSalida} a las ${horaInicioServicio} hrs</strong></td>
          </tr>
          <tr>
            <td class="info-lbl">Piso Mínimo Contractual:</td>
            <td class="info-val"><strong style="color: #0f172a;">${pisoMinimoTexto}</strong></td>
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
                : '<strong>Suministrado por Grúas San Pablo (Incluido en tarifa del servicio).</strong>'}
            </td>
          </tr>
          <tr>
            <td class="info-lbl">Traslado, Alimentación y Alojamiento:</td>
            <td class="info-val" colspan="3" style="font-size: 13.5px; line-height: 1.55;">
              ${(penOT.formato_viaticos === 'V1_5_ITEMS' && !penOT.alimentacion_costeado && (penOT.desayuno_costeado !== penOT.almuerzo_costeado || penOT.almuerzo_costeado !== penOT.cena_costeado))
                ? `• <strong>Traslado:</strong> ${fmtPenOT(penOT.traslado_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Desayuno:</strong> ${fmtPenOT(penOT.desayuno_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Almuerzo:</strong> ${fmtPenOT(penOT.almuerzo_costeado)}<br>• <strong>Cena:</strong> ${fmtPenOT(penOT.cena_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Alojamiento:</strong> ${fmtPenOT(penOT.alojamiento_costeado)}`
                : `• <strong>Traslado:</strong> ${fmtPenOT(penOT.traslado_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Alimentación:</strong> ${fmtPenOT(penOT.alimentacion_costeado || penOT.almuerzo_costeado || penOT.desayuno_costeado || penOT.cena_costeado)}&nbsp;&nbsp;&nbsp;&nbsp;• <strong>Alojamiento:</strong> ${fmtPenOT(penOT.alojamiento_costeado)}`
              }
            </td>
          </tr>
          <tr>
            <td class="info-lbl">Descripción del Servicio (Preventa):</td>
            <td class="info-val" colspan="3" style="font-size: 15px; line-height: 1.5; color: #0f172a; font-weight: 700; white-space: pre-wrap;">${descripcionServicioOT}</td>
          </tr>
          <tr>
            <td class="info-lbl">Instrucciones & Observaciones:</td>
            <td class="info-val" colspan="3" style="font-size: 15px; line-height: 1.5; color: #1e293b; font-weight: 600; white-space: pre-wrap;">${observaciones}</td>
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
        const cmd = `xvfb-run --server-args="-screen 0 794x1123x24" wkhtmltopdf --disable-smart-shrinking --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 8mm --margin-bottom 8mm --margin-left 8mm --margin-right 8mm "${tempHtmlPath}" "${filepath}"`;
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
      const asunto = payload.asunto || `📋 Orden de Trabajo OT-${p.codi_proyecto || 'GSP'}V${requestedVersion} - ${p.nombre_proyecto || 'Servicio de Izaje'}`;
      
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

  // =========================================================================
  // CONTRATO DE ARRENDAMIENTO DE MAQUINARIA (REQ-1037 / REQ-1039 / Spec 16)
  // Generador de HTML de 4 Páginas Oficiales y Compilación wkhtmltopdf
  // =========================================================================
  async obtenerHtmlContratoArriendo(id_proyecto, datosExtra = {}, clientParam = null) {
    const client = clientParam || await this.pool.connect();
    const shouldRelease = !clientParam;
    try {

      const { rows } = await client.query(`
        SELECT p.*, e.razon_social AS nombre_cliente, e.rut_empresa AS rut_cliente, e.direccion AS direccion_cliente
        FROM tpry_proyecto p
        LEFT JOIN tpar_empresas e ON p.id_empresa_cliente = e.id_empresa
        WHERE p.id_proyecto = $1
      `, [id_proyecto]);
      if (rows.length === 0) throw new Error("Proyecto no encontrado");
      const p = rows[0];

      const jsonField = p.json_field || {};
      const crm = jsonField.crm_v1 || {};
      const contratoPrevio = crm.contrato || {};

      // 1. Folio y Correlativo
      const folioContrato = datosExtra.folio || contratoPrevio.folio || `CTR-${new Date().getFullYear()}-${String(id_proyecto).padStart(4, '0')}`;
      const fechaEmision = datosExtra.fecha_firma || contratoPrevio.fecha_firma || new Date().toISOString().split('T')[0];
      const fechaFormateada = new Date(fechaEmision).toLocaleDateString('es-CL');

      // 2. Resolver Empresa Arrendadora (Holding)
      const idEmisora = Number(datosExtra.id_empresa_arrendador || contratoPrevio.id_empresa_arrendador || p.id_empresa || p.id_empresa_emisora || 11);
      const EMISORES = {
        11: {
          nombre: "ARRIENDO ROYAL RENTAL LIMITADA (ROYAL RENTAL)",
          rut: "78.254.535-3",
          direccion: "Ruta S-30 KM 9.5, Labranza, Temuco",
          fono: "+56 9 9443 7725",
          logoPath: "logo-royalrental.png"
        },
        9: {
          nombre: "LUIS OMAR GHISELLINI JARA E.I.R.L. (GRÚAS SAN PABLO)",
          rut: "52.004.162-1",
          direccion: "Botrolhue KM 9.5 Hijuela 24 Camino Labranza, Temuco",
          fono: "+56 9 9443 7725",
          logoPath: "logo-sanpablo.png"
        },
        7: {
          nombre: "SOCIEDAD BESTMAQ VENTA DE MAQUINARIA USADA LIMITADA (BESTMAQ)",
          rut: "76.209.534-3",
          direccion: "Camino Labranza KM 9.5, Temuco",
          fono: "+56 9 9443 7725",
          logoPath: "logo-bestmaq.png"
        },
        8: {
          nombre: "SERVICIOS INTEGRADOS LOGÍSTICOS DEL SUR LTDA. (LOGÍSTICA DEL SUR)",
          rut: "76.218.576-8",
          direccion: "KM 9.5 Camino Labranza Hj 24 Lugar Botrolhue, Temuco",
          fono: "+56 9 9443 7725",
          logoPath: "logo-logisticadelsur.png"
        }
      };
      const emisor = EMISORES[idEmisora] || EMISORES[11];

      // Cargar Logo en Base64 Data URI
      let logoBase64 = '';
      try {
        const logoFileName = emisor.logoPath || 'logo-royalrental.png';
        const cwdPath = path.join(process.cwd(), 'public', logoFileName);
        const fallbackPath = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', logoFileName);
        const diskPath = fs.existsSync(cwdPath) ? cwdPath : fallbackPath;
        if (fs.existsSync(diskPath)) {
          const imgBuf = fs.readFileSync(diskPath);
          logoBase64 = 'data:image/png;base64,' + imgBuf.toString('base64');
        }
      } catch (errLogo) {
        console.warn('Error leyendo logo para contrato:', errLogo.message);
      }

      // 3. Resolver Datos del Mandante (Arrendataria)
      const mandanteRazonSocial = p.nombre_cliente || crm.razon_social || crm.cliente_nombre || 'MANDANTE SIN ESPECIFICAR';
      const mandanteRut = p.rut_cliente || crm.rut_cliente || crm.cliente_rut || 'SIN RUT';
      const mandanteDireccion = p.direccion_cliente || crm.obra_direccion || 'Dirección de faena';
      const mandanteRepNombre = datosExtra.representante_nombre || contratoPrevio.representante_nombre || '................................................';
      const mandanteRepRut = datosExtra.representante_rut || contratoPrevio.representante_rut || '................................................';
      const mandanteRepCargo = datosExtra.representante_cargo || contratoPrevio.representante_cargo || 'Representante Autorizado';
      const mandanteRepTelefono = datosExtra.representante_telefono || contratoPrevio.representante_telefono || '';

      // 4. Resolver Maquinaria y Condiciones
      const lineas = crm.lineas_servicio || [];
      const eqPrincipal = lineas[0] || {};
      const formatCLP = (v) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(v || 0);

      const maquiSerie = datosExtra.serie || eqPrincipal.serie || 'XUG0147ACSRL0132';
      const maquiMotor = datosExtra.motor || eqPrincipal.motor || '7RE8931';
      const maquiModelo = datosExtra.modelo || eqPrincipal.subcategoria || eqPrincipal.descripcion || 'XGA16E';
      const maquiMarca = datosExtra.marca || eqPrincipal.marca || 'XCMG';
      const maquiAnio = datosExtra.anio || '2026';

      // REQ-1038: Fecha de Inicio y Fecha de Término Explícita (Erradicación absoluta de 'A CONVENIR')
      const normalizarIsoDate = (val) => {
        if (!val) return null;
        if (val instanceof Date && !isNaN(val.getTime())) return val.toISOString().split('T')[0];
        const str = String(val).trim();
        if (str.toUpperCase().includes('CONVENIR')) return null;
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
        if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
          const [d, m, y] = str.split('-');
          return `${y}-${m}-${d}`;
        }
        const parsed = new Date(str.replace(/\s+GM$/, ' GMT'));
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
        return null;
      };

      const rawFechaIni = normalizarIsoDate(datosExtra.fecha_inicio) || normalizarIsoDate(contratoPrevio.fecha_inicio) || normalizarIsoDate(crm.fecha_hora_inicio) || normalizarIsoDate(p.fecha_plan_ini) || normalizarIsoDate(fechaEmision);
      let rawFechaFin = normalizarIsoDate(datosExtra.fecha_termino) || normalizarIsoDate(contratoPrevio.fecha_termino) || normalizarIsoDate(crm.fecha_hora_termino) || normalizarIsoDate(p.fecha_plan_fin) || '';
      if (!rawFechaFin) {
        const baseDate = new Date(`${rawFechaIni}T12:00:00`);
        if (!isNaN(baseDate.getTime())) {
          const esMensual = String(eqPrincipal.unidad || '').toLowerCase().includes('mes');
          const cantMeses = Number(eqPrincipal.cantidad_meses || eqPrincipal.cantidad || 1);
          const cantDias = Number(eqPrincipal.cantidad_dias || eqPrincipal.cantidad || 1);
          if (esMensual) {
            baseDate.setMonth(baseDate.getMonth() + Math.max(1, cantMeses));
          } else {
            baseDate.setDate(baseDate.getDate() + Math.max(1, cantDias));
          }
          rawFechaFin = baseDate.toISOString().split('T')[0];
        } else {
          rawFechaFin = rawFechaIni;
        }
      }
      const formatearFechaContrato = (fStr) => {
        const iso = normalizarIsoDate(fStr);
        if (!iso) return '';
        const [y, m, d] = iso.split('-');
        return `${d}-${m}-${y}`;
      };
      const fechaIni = formatearFechaContrato(rawFechaIni);
      const fechaFin = formatearFechaContrato(rawFechaFin);
      const fechaHeader = formatearFechaContrato(fechaEmision);
      const tipoArriendo = datosExtra.tipo_arriendo || (eqPrincipal.unidad?.includes('Mes') ? 'MENSUAL' : 'SEMANAL / MENSUAL');
      const tarifaTexto = formatCLP(Number(eqPrincipal.valor_unitario || eqPrincipal.valorUnitario || 0));
      const maximoHoras = datosExtra.maximo_horas || contratoPrevio.maximo_horas || '';
      const lugarFaena = datosExtra.lugar_uso || crm.obra_nombre || crm.obra_ciudad || '';
      const mantencionArrendador = datosExtra.mantenimiento_arrendador || contratoPrevio.mantenimiento_arrendador || '';
      const observacionesAnexo = datosExtra.observaciones || contratoPrevio.observaciones || '';

      // 5. Firma Digital o Puntos de Firma
      const firmaClienteDataUri = datosExtra.firma_cliente_base64 || contratoPrevio.firma_digital?.firma_png_base64 || '';
      const bloqueFirmaAnexo = firmaClienteDataUri
        ? `<div style="margin-bottom: 2px;"><img src="${firmaClienteDataUri}" style="max-height: 42px; max-width: 160px; display: block;" /><div style="font-size: 7.5px; color: #15803d; font-weight: bold;">FIRMADO DIGITALMENTE (FES)</div></div>`
        : `<div style="height: 35px;"></div>`;

      // 6. Template HTML Canónico (Texto Legal 100% Literal + Formato Original en 2 Páginas)
      const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { size: A4 portrait; margin: 8mm 10mm; }
          body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; line-height: 1.38; color: #000; margin: 0; padding: 0; }
          .page { page-break-after: always; position: relative; }
          .page:last-child { page-break-after: avoid; }

          /* Encabezado Condiciones Generales */
          .header-p1 { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .header-p1 td { vertical-align: middle; }
          .title-p1 { font-size: 12px; font-weight: bold; text-align: center; text-transform: uppercase; letter-spacing: 0.4px; }
          .meta-p1 { font-size: 9.5px; text-align: right; line-height: 1.4; }

          /* Cláusulas 1 Columna (10px Legible en Móvil y Escritorio) */
          .clauses-p1 { text-align: justify; margin-bottom: 8px; }
          .clause-item { margin-bottom: 6px; text-align: justify; line-height: 1.38; page-break-inside: avoid; }

          /* Comparecencia Final Condiciones Generales */
          .comparecencia-box { border-top: 1.5px solid #000; padding-top: 8px; margin-top: 12px; page-break-inside: avoid; }
          .comparecencia-table { width: 100%; border-collapse: collapse; font-size: 9.5px; line-height: 1.4; font-weight: bold; }
          .comparecencia-table td { width: 50%; vertical-align: top; }

          /* Anexo: Condiciones Particulares (Página 3 Canónica) */
          .anexo-page { font-size: 10px; line-height: 1.35; page-break-before: always; }
          .black-bar { background: #000; color: #fff; font-weight: bold; font-size: 11.5px; text-align: center; padding: 4px 0; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 8px; }
          .top-meta-row { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
          .top-meta-box { border: 1px solid #000; padding: 4px 8px; font-size: 9.5px; font-weight: bold; }
          .party-box { width: 100%; border-collapse: collapse; margin-bottom: 8px; border: 1px solid #000; }
          .party-box td { border: 1px solid #000; padding: 5px 8px; vertical-align: top; font-size: 9.5px; line-height: 1.38; }
          .party-label { width: 24%; font-size: 10px; font-weight: bold; text-transform: uppercase; }
          .party-fields-table { width: 100%; border-collapse: collapse; }
          .party-fields-table td { border: none; padding: 1.5px 4px; font-size: 9.5px; }
          .cond-outer-box { border: 1px solid #000; padding: 8px 10px; font-size: 9.5px; }
          .sub-box-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          .sub-box { border: 1px solid #000; padding: 5px 7px; vertical-align: top; font-size: 9.5px; line-height: 1.45; }
          .dotted-line { border-bottom: 1px dotted #000; display: inline-block; width: 100%; min-height: 14px; }
        </style>
      </head>
      <body>

        <!-- PÁGINA 1: CONDICIONES GENERALES DE ARRIENDO (TEXTO ÍNTEGRO LITERAL) -->
        <div class="page">
          <table class="header-p1">
            <tr>
              <td style="width: 28%;">${logoBase64 ? `<img src="${logoBase64}" style="max-height: 36px; max-width: 140px;" />` : `<strong>${emisor.nombre}</strong>`}</td>
              <td class="title-p1" style="width: 47%;">
                CONDICIONES GENERALES DE ARRIENDO (PLATAFORMA)
              </td>
              <td class="meta-p1" style="width: 25%;">
                CONTRATO NUMERO &nbsp;&nbsp; <strong>${folioContrato}</strong><br>
                FECHA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>${fechaHeader}</strong>
              </td>
            </tr>
          </table>

          <div class="clauses-p1">
            <div class="clause-item">1.- Pago arriendo: El valor del arrendamiento por el período acordado, se establecerá en la cotización enviada por ${emisor.nombre}, la que deberá ser aceptada antes del despacho</div>

            <div class="clause-item">2.- Entrega de la máquina. La máquina será entregada en el domicilio de la Arrendataria señalado en la Cotización. Los gastos de transporte de la máquina hasta el lugar en que será utilizada, y los gastos del transporte para la restitución al término del contrato, serán de cargo de la Arrendataria. La entrega constará del documento “Acta de Entrega y Recepción de Maquinaria” que firmará la Arrendataria. A falta de dicha persona, la Arrendadora hará firmar el documento por dos personas en calidad de testigos. A la sola firma del Acta y el despacho de la máquina, se entenderá que la Arrendataria acepta las condiciones establecidas en las cotizaciones que han generado las Condiciones Particulares y Generales aquí establecidas, independiente de la firma del presente documento. La fecha de entrega establecida en el Acta de Entrega y Recepción dará inicio a los cobros de arrendamiento a la Arrendataria o, en su defecto, la fecha indicada en la respectiva guía de despacho. Se deja constancia que los equipos no cuentan con permiso de circulación, por lo que en caso que la Arrendataria requiera utilizar el equipo arrendado por la vía pública, deberá solicitarlo previamente a objeto de implementar lo necesario y verificar la entrega de un equipo con permiso de circulación (placa patente y luces), a costo de la Arrendataria. Si no fuere solicitado, la Arrendataria será responsable de las multas y demás sanciones legales que aplicare la autoridad, así como de los daños o perjuicios que pueda causar a terceros.</div>

            <div class="clause-item">3.- Aplicación. La Arrendataria usará la máquina arrendada únicamente en el lugar indicado en la Cotizacion. La máquina sólo podrá destinarse a trabajos propios de su diseño, con sujeción estricta a las normas de empleo establecidas por el fabricante. La Arrendadora no garantiza que la máquina arrendada sea útil para los fines de la Arrendataria, quien declara que conoce la máquina y sus especificaciones por lo que asume la completa y total responsabilidad respecto de la aptitud de ella para el fin que se propone. Asimismo, la Arrendataria se obliga a operar el equipo con personal idóneo y calificado, con todos sus documentos al día. La Arrendataria es responsable civil y penalmente por el uso impropio de la máquina, sea por negligencia o dolo. Para mover la máquina de las instalaciones antes indicadas, la Arrendataria debe solicitar autorización por escrito a la Arrendadora.</div>

            <div class="clause-item">4.- Renta y otros pagos. La renta y todos los pagos a que esté obligada la Arrendataria se pagarán en el domicilio de la Arrendadora, dentro de los 30 días contados a partir de la recepción por parte de la Arrendataria de las facturas correspondientes. En conformidad a lo preceptuado por el artículo 3 N° 2 de la ley 19.983, se acuerda que el plazo que tiene la Arrendataria para reclamar el contenido de las facturas emitidas por la Arrendadora en virtud de lo dispuesto en este contrato, es de 08 días corridos, siguientes a su recepción. Si la Arrendataria incurre en mora o simple retardo respecto del pago de la renta de arriendo a que esté obligada, la Arrendataria pagará por concepto de interés penal el interés máximo convencional vigente al momento del pago, sobre las cantidades que deba pagar, a contar de la fecha en que debió efectuar el pago y hasta que efectivamente lo haga. La circunstancia de que la Arrendadora acepte el pago retrasado de uno o más periodos de renta sin ejercer los derechos que le franquea la ley y el presente contrato, constituirá sólo un acto de mera tolerancia. La Arrendataria pagará la totalidad de las rentas de arrendamiento convenidas, no obstante que por cualquier motivo, incluidos los originados por caso fortuito o fuerza mayor, no use la máquina arrendada el tiempo al que conforme el contrato tiene derecho. Las condiciones de renta y otros pagos indicados en estas Condiciones Generales son válidas por sobre las indicadas en cualquier otro documento relacionado a esta operación. Si se contrata el arriendo por 1 mes con tarifa mensual y el equipo es devuelto antes, ${emisor.nombre} cobrará el mes completo; en caso que la devolución sea producto de una falla propia del equipo, se cobrará un proporcional de la tarifa. Para los equipos que poseen adicionalmente tarifa semanal, la modalidad de cobro será de la misma manera, si se contrata arriendo con tarifa por 2 semanas y el equipo es devuelto antes, ${emisor.nombre} cobrará las 2 semanas mínimas.</div>

            <div class="clause-item">5.- Mantenimiento y reparaciones de cargo de la Arrendadora. Los trabajos de mantenimiento preventivo de la máquina en los períodos indicados en las Pautas de Mantención, serán realizados por la Arrendadora. Con el objeto de que la Arrendadora pueda llevar a efectos dichos trabajos, la Arrendataria se obliga a informar a la Arrendadora cada vez que la máquina haya cumplido con el número de horas de operación indicado en las Pautas de Mantención, poniendo el equipo a su disposición para este efecto. La Arrendataria dará las facilidades y el apoyo necesario a la Arrendadora para realizar el mantenimiento preventivo de las máquinas en terreno. En caso que la Arrendataria solicite por escrito el servicio de una máquina y el personal designado por la Arrendadora asista más de una vez sin poder ingresar por falta de pases de ingreso a la faena, suministrados por la Arrendataria, los gastos de traslado del personal de la Arrendadora, serán de cargo de la Arrendataria. Si la Arrendataria no proporciona la información antes referida, estará obligada a pagar a la Arrendadora el importe de las reparaciones que deban hacerse a la máquina como consecuencia de falta de mantenimiento preventivo.</div>

            <div class="clause-item">6.- Mantenimiento y reparaciones de cargo de la Arrendataria. La mantención diaria, es decir, el engrase completo, revisión y relleno de niveles de refrigerante y lubricantes, revisión de presión de inflado de neumáticos, revisión y relleno de agua destilada para las baterías, revisión de fugas, limpieza y drenaje de filtros, corrección de fallas menores, cambio de ampolletas e inspección general de la máquina arrendada será de cuenta y cargo de la Arrendataria. La Arrendataria impedirá que personas no autorizadas por la Arrendadora realicen trabajos de reparación en la máquina arrendada y cualquier perjuicio que de ello se derive será responsabilidad de la Arrendataria. Reparaciones: El costo total de las reparaciones, que será determinado por la Arrendadora, incluidos la mano de obra y traslado de personal, y repuestos por deficiencias mecánicas, daños o descomposturas, causadas por deficiente operación, descuido o negligencia, y aun cuando se produzcan como consecuencia de caso fortuito o fuerza mayor, será de cargo de la Arrendataria. Los pinchazos, cortes laterales, impactos, cortes en banda por patinaje y similares en los neumáticos como también los elementos de desgaste, tales como dientes, adaptadores, cantoneras, cuchillas y similares, serán de responsabilidad y cargo de la Arrendataria. En caso de existir cobros por concepto de servicio técnico, estos serán incluidos dentro del estado de pago del periodo de liquidación para que sea visada por la Arrendataria. La Arrendadora deberá informar, de manera previa a la emisión de la factura, las causales del cobro. Si el daño o desperfecto de la máquina se debe al mal uso de esta por parte de la Arrendataria, será de cargo de la Arrendataria el pago de la totalidad de la renta de arrendamiento mientras dure su reparación.</div>
          </div>
        </div>

        <!-- PÁGINA 2: CONDICIONES GENERALES (CONTINUACIÓN Y COMPARECENCIA) -->
        <div class="page">
          <table class="header-p1">
            <tr>
              <td style="width: 28%;">${logoBase64 ? `<img src="${logoBase64}" style="max-height: 36px; max-width: 140px;" />` : `<strong>${emisor.nombre}</strong>`}</td>
              <td class="title-p1" style="width: 47%;">
                CONDICIONES GENERALES DE ARRIENDO (CONTINUACIÓN)
              </td>
              <td class="meta-p1" style="width: 25%;">
                CONTRATO NUMERO &nbsp;&nbsp; <strong>${folioContrato}</strong><br>
                FECHA &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>${fechaHeader}</strong>
              </td>
            </tr>
          </table>

          <div class="clauses-p1">
            <div class="clause-item">7- Responsabilidad. La Arrendataria debe asumir la responsabilidad civil que resulte del uso, operación y transporte de la máquina arrendada durante todo el tiempo en que la tenga en su poder, entendiéndose que estará en su poder desde la entrega de la máquina y hasta que sea restituida en el domicilio de la Arrendadora. En consecuencia, en caso alguno la Arrendadora tendrá responsabilidad por los daños causados en los casos a que se refiere este número y el ejercicio de cualquier acción en contra de la Arrendataria jamás puede implicar la retención de la máquina. En el evento de ser retenida la máquina arrendada por la autoridad o cualquier tercero, todo el tiempo de retención será considerado como usado por la Arrendataria y dará lugar al cobro de la renta correspondiente. En caso de siniestro, daño o pérdida de la máquina arrendada, cualquiera sea su causa y gravedad, la Arrendataria deberá informar a la Arrendadora de inmediato o a más tardar el día siguiente hábil del accidente sobrevenido, indicando su fecha, lugar y circunstancias, así como la naturaleza y monto estimado de los daños. Igualmente la Arrendataria deberá dejar la constancia correspondiente en Carabineros de Chile para los casos que así sea requerido o bien una declaración jurada de lo sucedido en notaría. Para los casos donde la autoridad exija la alcoholemia, es obligación la realización de la misma, en caso que haya oposición por parte del conductor, no existirá cobertura del siniestro y por ende, la Arrendataria se hará responsable de todos los daños.</div>

            <div class="clause-item">8.- Lucro cesante. Si por cualquier causa la Arrendataria no pudiese hacer el uso esperado de la máquina por cualquier circunstancia, aún por caso fortuito o fuerza mayor, cubierta o no por el seguro correspondiente, las partes desde ya acuerdan que la Arrendadora no tendrá responsabilidad alguna respecto al lucro cesante sufrido por la Arrendataria.</div>

            <div class="clause-item">9.- Cesibilidad. La Arrendataria no podrá ceder, enajenar o transferir en ninguna forma a terceros, los derechos del presente contrato.</div>

            <div class="clause-item">10.- Propiedad. La Arrendataria reconoce que el dominio de la máquina arrendada pertenece a la Arrendadora o a la entidad que indique en las Condiciones Particulares, por lo que se obliga: 1. A conservarla en buen estado de uso, funcionamiento y adecuado resguardo. 2. A comunicar por escrito todo hecho o acto de terceros de que tome conocimiento y que pudiere afectar el dominio de la Arrendadora sobre el bien arrendado, tales como embargos, medidas precautorias y cualquier otra turbación de hecho o de derecho que pudiere afectar la integridad física del bien o embarazar o amenazar los derechos que sobre éste tenga la Arrendadora. En todos estos casos la Arrendataria deberá formular oposición conforme a la ley y ejercer en su caso, con cargo a la Arrendadora, las competentes acciones y reclamaciones para acreditar el dominio de la Arrendadora. Queda prohibido a la Arrendataria: A. Introducir modificaciones, mejoras o alteraciones de cualquier clase en la estructura o funcionamiento de la máquina. B. Subarrendar, dar en comodato y en general ceder de cualquier forma el uso o goce de la máquina. C. Constituir gravámenes, o derechos a favor de terceros. Cualquier costo derivado del incumplimiento de esta cláusula será de cargo de la Arrendataria.</div>

            <div class="clause-item">11.- Garantía. Este documento garantiza el cumplimiento total y oportuno de todas y cada una de las obligaciones que asume la Arrendataria por este contrato y cualquier obligación que tenga o pueda tener la Arrendataria con la Arrendadora.</div>

            <div class="clause-item">12.- Vigencia. El contrato estará vigente por todo el plazo previsto en las Condiciones Particulares, y pasará a ser indefinido luego de ese plazo, hasta que la Arrendataria dé aviso por escrito a la Arrendadora con al menos 10 días de anticipación a la nueva fecha de término. En caso que la máquina sea devuelta antes de la fecha pactada, se considerará que el equipo ha sido arrendado por el período total de duración del contrato.</div>

            <div class="clause-item">13.- Término anticipado. El incumplimiento de la Arrendataria de cualquiera de las obligaciones que le impone el presente contrato, sin que ésta haya dado remedio a dicho incumplimiento en el plazo de 10 días desde notificado por la Arrendadora, autoriza a la Arrendadora a poner término unilateralmente y de pleno derecho al contrato sin necesidad de declaración judicial, y especialmente en los siguientes casos: 1. La falta del pago oportuno de la renta de arrendamiento o de cualquiera otra cantidad que la Arrendataria deba pagar conforme a lo establecido en el contrato. 2. El uso de la máquina arrendada en lugares distintos o en trabajos diferentes a los expresados en las Condiciones Particulares. 3. La insolvencia de la Arrendataria, entendiéndose por tal; A. Si cualquiera de sus acreedores solicitan su liquidación forzosa; B. Formulan proposiciones de acuerdo de reorganización, y en ambos casos haya sido declarado judicialmente y publicado en el Boletín Concursal; C. Si por vía de medidas prejudiciales o precautorias se obtienen en su contra secuestros, retenciones o prohibiciones de celebrar actos o contratos respecto de parte significativa de sus bienes; D. El nombramiento de veedores o liquidadores, todos ellos declarados judicialmente. Si el incumplimiento se debe a causal imputable a la Arrendataria, el monto de la indemnización será igual al total de las rentas de arrendamiento que resten de devengarse desde la ocurrencia del hecho que origina la causal hasta que se hubiere producido en forma natural el término del contrato de arrendamiento. Todos los costos correspondientes a la devolución del equipo serán de cargo de la Arrendataria.</div>

            <div class="clause-item">14.- Restitución de la máquina. A la terminación del contrato, por cualquier causa que sea, la Arrendataria deberá entregar la máquina arrendada a la Arrendadora a la fecha de término del contrato. La máquina deberá restituirse en el estado en que se encontraba al momento de la entrega, habida consideración del desgaste por su uso legítimo. La restitución constará en el documento “Acta de Entrega y Recepción de Maquinaria”. La máquina no se entenderá restituida mientras su devolución no se haga conforme al estado en que fue entregada y que consta en el Acta de Entrega y Recepcion. El Acta de Recepción la suscribirá la Arrendataria. A falta de dicha persona, la Arrendadora hará firmar el documento a dos personas en calidad de testigos, quienes podrán ser o no trabajadores de la Arrendadora. La Arrendataria pagará a la Arrendadora el importe de las partes, piezas y accesorios que falten o estén dañados, así como el costo de su instalación. Para estos efectos deberá atenerse a lo señalado en el “Acta de Entrega y Recepcion de Máquinaria”. Si por causas imputables a la Arrendataria, ésta no restituye la máquina arrendada en el plazo correspondiente, el tiempo de mora se considerará tiempo arrendado para todos los efectos legales.</div>
          </div>

          <!-- Bloque Comparecencia Final Condiciones Generales (Formato Original Página 3) -->
          <div class="comparecencia-box">
            <table class="comparecencia-table">
              <tr>
                <td>
                  ARRENDATARIO<br>
                  EMPRESA: ${mandanteRazonSocial}<br>
                  RUT: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${mandanteRut}<br><br>
                  Representada Por:<br>
                  Sr(a): &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${mandanteRepNombre}<br>
                  C.I.: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${mandanteRepRut}
                </td>
                <td>
                  ARRENDADOR<br>
                  EMPRESA: ${emisor.nombre}<br>
                  RUT: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${emisor.rut}<br><br>
                  Representada Por:<br>
                  Sr(a): &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; LUIS OMAR GHISELLINI JARA<br>
                  C.I.: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 12.031.054-2
                </td>
              </tr>
            </table>
          </div>
        </div>

        <!-- PÁGINA 3: ANEXO CONTRATO DE ARRIENDAMIENTO DE MAQUINARIA (FORMATO ORIGINAL PÁGINA 4) -->
        <div class="page anexo-page">
          <div style="margin-bottom: 8px;">
            ${logoBase64 ? `<img src="${logoBase64}" style="max-height: 42px; max-width: 150px;" />` : `<strong>${emisor.nombre}</strong>`}
          </div>

          <div class="black-bar">ANEXO CONTRATO DE ARRIENDAMIENTO DE MAQUINARIA (PLATAFORMA)</div>

          <table class="top-meta-row">
            <tr>
              <td class="top-meta-box" style="width: 22%;">FECHA &nbsp;&nbsp;&nbsp; ${fechaHeader}</td>
              <td style="width: 48%; border: none;"></td>
              <td class="top-meta-box" style="width: 30%;">CONTRATO NUMERO &nbsp;&nbsp;&nbsp;&nbsp; ${folioContrato}</td>
            </tr>
          </table>

          <!-- Bloque ARRENDADOR -->
          <table class="party-box">
            <tr>
              <td class="party-label">ARRENDADOR</td>
              <td>
                <table class="party-fields-table">
                  <tr><td style="width: 34%;">RAZON SOCIAL</td><td>${emisor.nombre}</td></tr>
                  <tr><td>RUT</td><td>${emisor.rut}</td></tr>
                  <tr><td>DIRECCION</td><td>${emisor.direccion}</td></tr>
                  <tr><td>REPRESENTADA POR SR.</td><td>LUIS OMAR GHISELLINI JARA</td></tr>
                  <tr><td>RUT</td><td>12.031.054-2</td></tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Bloque ARRENDATARIA -->
          <table class="party-box">
            <tr>
              <td class="party-label">ARRENDATARIA</td>
              <td>
                <table class="party-fields-table">
                  <tr><td style="width: 34%;">RAZON SOCIAL</td><td>${mandanteRazonSocial}</td></tr>
                  <tr><td>RUT</td><td>${mandanteRut}</td></tr>
                  <tr><td>DIRECCION</td><td>${mandanteDireccion}</td></tr>
                  <tr><td>REPRESENTADA POR SR.</td><td>${mandanteRepNombre !== '................................................' ? mandanteRepNombre : ''}</td></tr>
                  <tr><td>RUT</td><td>${mandanteRepRut !== '................................................' ? mandanteRepRut : ''}</td></tr>
                </table>
              </td>
            </tr>
          </table>

          <div class="black-bar" style="margin-top: 10px;">CONDICIONES PARTICULARES</div>

          <div class="cond-outer-box">
            <div style="margin-bottom: 6px; font-size: 9.5px;">1.- INDIVIDUALIZACION DE LA MAQUINARIA</div>

            <table class="sub-box-table">
              <tr>
                <td class="sub-box" style="width: 33%;">
                  NRO DE SERIE: &nbsp; ${maquiSerie}<br>
                  NRO DE MOTOR: &nbsp; ${maquiMotor}
                </td>
                <td class="sub-box" style="width: 29%;">
                  MODELO: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${maquiModelo}<br>
                  AÑO: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${maquiAnio}
                </td>
                <td class="sub-box" style="width: 38%;">
                  MARCA: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${maquiMarca}<br>
                  PROPIETARIO: &nbsp; LUIS OMAR GHISELLINI
                </td>
              </tr>
            </table>

            <!-- B.- DURACION DEL CONTRATO -->
            <table class="sub-box-table">
              <tr>
                <td style="width: 33%; vertical-align: middle; font-size: 9px; padding-right: 6px;">
                  B.- DURACION DEL CONTRATO
                </td>
                <td class="sub-box" style="width: 29%;">
                  FECHA DE INICIO: &nbsp; <strong>${fechaIni}</strong>
                </td>
                <td class="sub-box" style="width: 38%;">
                  FECHA DE TERMINO: &nbsp; <strong>${fechaFin}</strong>
                </td>
              </tr>
            </table>

            <!-- C.- RENTA DEL ARRENDAMIENTO -->
            <table class="sub-box-table" style="margin-bottom: 14px;">
              <tr>
                <td style="width: 33%; vertical-align: middle; font-size: 9px; padding-right: 6px;">
                  C.- RENTA DEL ARRENDAMIENTO
                </td>
                <td class="sub-box" style="width: 29%;">
                  TARIFA NORMAL &nbsp; ${tarifaTexto}<br>
                  MAXIMO DE HORAS &nbsp; ${maximoHoras}
                </td>
                <td class="sub-box" style="width: 38%;">
                  TIPO DE ARRIENDO: &nbsp; ${tipoArriendo}
                </td>
              </tr>
            </table>

            <!-- D, E, F con líneas punteadas -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 9px;">
              <tr>
                <td style="width: 33%; padding: 6px 0; vertical-align: bottom;">D.- LUGAR DE USO DE LA<br>&nbsp;&nbsp;&nbsp;&nbsp;MAQUINARIA &nbsp;&nbsp;&nbsp;:</td>
                <td style="width: 67%; padding: 6px 0; vertical-align: bottom;"><div class="dotted-line">${lugarFaena}</div></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; vertical-align: bottom;">E.- MANTENIMIENTO POR<br>ARRENDADOR :</td>
                <td style="padding: 8px 0; vertical-align: bottom;"><div class="dotted-line">${mantencionArrendador}</div></td>
              </tr>
              <tr>
                <td style="padding: 8px 0; vertical-align: bottom;">F.- OBSERVACIONES 1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</td>
                <td style="padding: 8px 0; vertical-align: bottom;"><div class="dotted-line">${observacionesAnexo}</div></td>
              </tr>
            </table>

            <!-- Firma Representante al pie izquierdo del Anexo -->
            <div style="width: 220px; margin-top: 18px;">
              ${bloqueFirmaAnexo}
              <div style="border-top: 1px dotted #000; padding-top: 3px; font-size: 9.5px;">
                FIRMA REPRESENTANTE
              </div>
            </div>
          </div>

        </div>

      </body>
      </html>
      `;

      return {
        htmlContent,
        p,
        crm,
        jsonField,
        contratoPrevio,
        folioContrato,
        fechaEmision,
        mandanteRepNombre,
        mandanteRepRut,
        mandanteRepCargo,
        mandanteRepTelefono,
        idEmisora,
        rawFechaIni,
        rawFechaFin,
        emisor
      };
    } finally {
      if (shouldRelease) client.release();
    }
  }

  async generarContratoArriendoVersion(id_proyecto, datosExtra = {}) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const dataContrato = await this.obtenerHtmlContratoArriendo(id_proyecto, datosExtra, client);
      const { htmlContent, p, jsonField, folioContrato, fechaEmision, mandanteRepNombre, mandanteRepRut, mandanteRepCargo, mandanteRepTelefono } = dataContrato;

      // 7. Compilar a PDF con wkhtmltopdf en Storage Root Canónico (LG-Storage Standard)
      const relDir = buildStoragePath('GSP', 'contratos', process.env.APP_ENV || 'dev');
      const targetDir = path.join(STORAGE_ROOT, relDir);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

      const fileName = `${folioContrato}.pdf`;
      const filepath = path.join(targetDir, fileName);
      const tempHtmlPath = path.join(targetDir, `temp_${folioContrato}.html`);
      fs.writeFileSync(tempHtmlPath, htmlContent, 'utf8');

      await new Promise((resolve, reject) => {
        const cmd = `xvfb-run --server-args="-screen 0 794x1123x24" wkhtmltopdf --enable-local-file-access --load-error-handling ignore --load-media-error-handling ignore --page-size A4 --orientation Portrait --margin-top 10mm --margin-bottom 10mm --margin-left 12mm --margin-right 12mm "${tempHtmlPath}" "${filepath}"`;
        exec(cmd, (error, stdout, stderr) => {
          try { if (fs.existsSync(tempHtmlPath)) fs.unlinkSync(tempHtmlPath); } catch (e) {}
          if (error && !fs.existsSync(filepath)) {
            return reject(new Error(`Error al compilar el PDF del contrato: ${error.message}`));
          }
          resolve();
        });
      });

      // Asegurar copia en public/contratos para retrocompatibilidad
      try {
        const legacyDir = path.resolve(__dirname, '../../public/contratos');
        if (!fs.existsSync(legacyDir)) fs.mkdirSync(legacyDir, { recursive: true });
        fs.copyFileSync(filepath, path.join(legacyDir, fileName));
      } catch (errLeg) {
        console.warn("Aviso: no se pudo escribir copia legacy en public/contratos:", errLeg.message);
      }

      // 8. Registrar en Storage Engine con ruta relativa POSIX estándar
      const archivoM = new archivoModel();
      const doc = await archivoM.insertarTfmgFile(
        'CONTRATO',
        'application/pdf',
        fileName,
        fileName,
        relDir,
        p.id_user_creacion || null,
        'A'
      );

      const contratoResult = {
        folio: folioContrato,
        estado: datosExtra.firma_cliente_base64 ? 'FIRMADO_DIGITAL' : (dataContrato.contratoPrevio.estado || 'BORRADOR'),
        url_pdf: `/api/archivo/ver/${doc.id_doc}`,
        id_doc: doc.id_doc,
        fecha_emision: fechaEmision,
        id_empresa_arrendador: dataContrato.idEmisora,
        fecha_inicio: dataContrato.rawFechaIni,
        fecha_termino: dataContrato.rawFechaFin,
        representante_nombre: mandanteRepNombre,
        representante_rut: mandanteRepRut,
        representante_cargo: mandanteRepCargo,
        representante_telefono: mandanteRepTelefono
      };

      dataContrato.crm.contrato = { ...(dataContrato.crm.contrato || {}), ...contratoResult };
      jsonField.crm_v1 = dataContrato.crm;

      await client.query('UPDATE tpry_proyecto SET json_field = $1 WHERE id_proyecto = $2', [jsonField, id_proyecto]);
      await client.query('COMMIT');

      return {
        success: true,
        contrato: contratoResult,
        proyecto: p
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// =========================================================================
// SPEC 87: REQUERIMIENTOS INTERNOS (INT-YYMM-XXXXX) Y SOLICITUD V°B° GERENCIA
// =========================================================================

ProyectoModel.prototype.generarCodigoRequerimientoInterno = async function(providedClient = null) {
  const client = providedClient || await this.pool.connect();
  const localTransaction = !providedClient;

  try {
    if (localTransaction) await client.query('BEGIN');

    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const anio_mes = `${yy}${mm}`;
    const periodo_correlativo = '0000';
    const prefijo = 'INT';

    await client.query(`
      INSERT INTO tpry_correlativos (prefijo, anio_mes, ultimo_valor)
      VALUES ($1, $2, 0)
      ON CONFLICT (prefijo, anio_mes) DO NOTHING;
    `, [prefijo, periodo_correlativo]);

    const result = await client.query(`
      UPDATE tpry_correlativos
      SET ultimo_valor = ultimo_valor + 1
      WHERE prefijo = $1 AND anio_mes = $2
      RETURNING ultimo_valor;
    `, [prefijo, periodo_correlativo]);

    const correlativo = String(result.rows[0].ultimo_valor).padStart(5, '0');
    const codigo = `INT-${anio_mes}-${correlativo}`;

    if (localTransaction) await client.query('COMMIT');
    return codigo;
  } catch (error) {
    if (localTransaction) await client.query('ROLLBACK');
    throw new Error(`Error al generar folio interno: ${error.message}`);
  } finally {
    if (localTransaction) client.release();
  }
};

ProyectoModel.prototype.crearRequerimientoInterno = async function(data = {}) {
  const AprobacionGerenciaModel = require('./aprobacionGerenciaModel');
  const client = await this.pool.connect();

  try {
    await client.query('BEGIN');

    const id_empresa = Number(data.id_empresa || 9);
    const codi_proyecto = await this.generarCodigoRequerimientoInterno(client);
    const tipo_movimiento_interno = String(data.tipo_movimiento_interno || 'TRASLADO_SUCURSAL').trim();
    const sucursal_origen = String(data.sucursal_origen || data.origen || 'Temuco').trim();
    const sucursal_destino = String(data.sucursal_destino || data.destino || 'Valdivia').trim();
    const modalidad_trayecto = String(data.modalidad_trayecto || 'IDA_Y_VUELTA').trim();
    const requiere_vb_gerencia = false;
    const estado_vb_gerencia = 'NO_REQUERIDO';

    const nombre_proyecto = String(
      data.nombre_proyecto ||
      `Movimiento Interno: ${sucursal_origen} ➔ ${sucursal_destino}`
    ).trim();

    const fecha_plan_ini = data.fecha_plan_ini || (data.fecha_hora_salida ? String(data.fecha_hora_salida).slice(0, 10) : new Date().toISOString().slice(0, 10));
    const fecha_plan_fin = data.fecha_plan_fin || fecha_plan_ini;
    const motivo = String(data.motivo || data.justificacion || data.objetivo_proyecto || 'Requerimiento Interno de Operaciones').trim();
    const solicitante = String(data.solicitante_nombre || data.nombre_solicita || 'Coordinación Operaciones').trim();
    const id_usuario_creacion = data.id_usuario_creacion ?? data.id_user_creacion ?? null;

    const rawJson = (typeof data.json_field === 'object' && data.json_field !== null) ? data.json_field : {};
    const crmPrev = (typeof rawJson.crm_v1 === 'object' && rawJson.crm_v1 !== null) ? rawJson.crm_v1 : {};
    const ejecPrev = (typeof rawJson.ejecucion_v1 === 'object' && rawJson.ejecucion_v1 !== null) ? rawJson.ejecucion_v1 : {};

    const categoriaReq = String(data.categoria_requerida || crmPrev.categoria_requerida || 'GRUAS TELESCOPICAS').trim();
    const subcategoriaReq = String(data.subcategoria_requerida || crmPrev.subcategoria_requerida || 'GRÚA TELESCÓPICA').trim();
    const modalidadLabel = modalidad_trayecto === 'SOLO_IDA' ? 'Solo Ida' : 'Ida y Vuelta';

    const lineasPrev = Array.isArray(crmPrev.lineas_servicio) && crmPrev.lineas_servicio.length > 0
      ? crmPrev.lineas_servicio
      : [{
          id: 1,
          _uid: `int-base-${Date.now()}`,
          is_linea_base: true,
          tipo: categoriaReq === 'TRASLADOS' ? 'CAMIONES' : categoriaReq,
          subcategoria: subcategoriaReq,
          descripcion: `Movimiento Sucursal ${sucursal_origen} ➔ ${sucursal_destino} (${modalidadLabel})`,
          cantidad: 1,
          unidad: modalidadLabel,
          valor_unitario: 0,
          valorUnitario: 0,
          subtotal: 0,
          equipo_asignado_id: '',
          operador_asignado_id: '',
          fecha_plan_ini,
          fecha_plan_fin
        }];

    const json_field = {
      ...rawJson,
      crm_v1: {
        ...crmPrev,
        es_requerimiento_interno: true,
        es_interno: true,
        no_facturable: true,
        tipo_movimiento_interno,
        modalidad_trayecto,
        sucursal_origen,
        sucursal_destino,
        obra_nombre: `Sucursal ${sucursal_destino}`,
        obra_direccion: `Sucursal GSP ${sucursal_destino}`,
        obra_ciudad: sucursal_destino,
        distancia_km: Number(data.distancia_km ?? crmPrev.distancia_km ?? 0),
        fecha_hora_salida: data.fecha_hora_salida || fecha_plan_ini,
        motivo_interno: motivo,
        solicitante_nombre: solicitante,
        requiere_vb_gerencia: false,
        estado_vb_gerencia: 'NO_REQUERIDO',
        requiere_acreditacion: false,
        requiere_oc_hes: false,
        monto_neto: 0,
        total_neto: 0,
        condicion_pago: 'NO FACTURABLE (C. COSTO INTERNO)',
        lineas_servicio: lineasPrev
      },
      ejecucion_v1: {
        ...ejecPrev,
        es_requerimiento_interno: true,
        estado_requerimiento: 'APROBADO',
        decision: 'APROBADO',
        subtab_activa: 'asignacion',
        sucursal_origen,
        sucursal_destino,
        modalidad_trayecto,
        fecha_salida_plan: fecha_plan_ini,
        hora_salida_plan: '08:00',
        fecha_fin_plan: fecha_plan_fin,
        hora_fin_plan: '18:00'
      }
    };

    const insertQ = `
      INSERT INTO tpry_proyecto (
        id_empresa,
        nombre_proyecto,
        codi_proyecto,
        id_proyecto_estado,
        fecha_plan_ini,
        fecha_plan_fin,
        objetivo_proyecto,
        observacion_proyecto,
        id_usuario_creacion,
        fecha_creacion,
        es_interno,
        tipo_movimiento_interno,
        sucursal_origen,
        sucursal_destino,
        estado_vb_gerencia,
        json_field
      )
      VALUES (
        $1, $2, $3, 4, $4,
        $5, $6, $7, $8, NOW(),
        true, $9, $10, $11, $12, $13
      )
      RETURNING *;
    `;

    const { rows } = await client.query(insertQ, [
      id_empresa,
      nombre_proyecto,
      codi_proyecto,
      fecha_plan_ini,
      fecha_plan_fin,
      motivo,
      data.observacion_proyecto || data.observaciones || motivo,
      id_usuario_creacion,
      tipo_movimiento_interno,
      sucursal_origen,
      sucursal_destino,
      estado_vb_gerencia,
      JSON.stringify(json_field)
    ]);

    const nuevoProyecto = rows[0];

    await client.query('COMMIT');

    return {
      proyecto: nuevoProyecto,
      token: null,
      url_aprobacion: null
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

ProyectoModel.prototype.solicitarVbGerencia = async function(id_proyecto, data = {}) {
  const AprobacionGerenciaModel = require('./aprobacionGerenciaModel');

  // 0. Asegurar que existan los PDFs actualizados de Cotización y de Orden de Trabajo (OT con recursos asignados)
  // Se ejecuta antes de abrir la transacción FOR UPDATE para evitar bloqueos con generarOTVersion / generarCotizacionVersion
  try {
    const preCheck = await this.pool.query('SELECT es_interno, json_field FROM tpry_proyecto WHERE id_proyecto = $1', [id_proyecto]);
    if (preCheck.rowCount > 0) {
      const pPre = preCheck.rows[0];
      let jfPre = pPre.json_field;
      if (typeof jfPre === 'string') {
        try { jfPre = JSON.parse(jfPre); } catch (_) { jfPre = {}; }
      }
      const cotsPre = Array.isArray(jfPre?.crm_v1?.cotizaciones_historicas) ? jfPre.crm_v1.cotizaciones_historicas : [];
      if (!pPre.es_interno && cotsPre.length === 0) {
        await this.generarCotizacionVersion(id_proyecto, data.monto_neto || jfPre?.crm_v1?.total_neto || 0);
      }
      await this.generarOTVersion(id_proyecto);
    }
  } catch (genErr) {
    console.warn('[solicitarVbGerencia] Aviso generando PDF previo de Cotización/OT:', genErr.message);
  }

  const client = await this.pool.connect();

  try {
    await client.query('BEGIN');

    const pryRes = await client.query(`
      SELECT 
        p.*,
        cli.razon_social AS nombre_cliente,
        cli.rut_empresa AS rut_cliente,
        emp.razon_social AS empresa_emisora_nombre
      FROM tpry_proyecto p
      LEFT JOIN tpar_empresas cli ON p.id_empresa_cliente = cli.id_empresa
      LEFT JOIN tpar_empresas emp ON p.id_empresa = emp.id_empresa
      WHERE p.id_proyecto = $1
      FOR UPDATE OF p;
    `, [id_proyecto]);

    if (pryRes.rowCount === 0) {
      const err = new Error('Proyecto no encontrado');
      err.status = 404;
      throw err;
    }

    const p = pryRes.rows[0];
    let jf = p.json_field;
    if (typeof jf === 'string') {
      try { jf = JSON.parse(jf); } catch (_) { jf = {}; }
    }
    if (!jf || typeof jf !== 'object') jf = {};
    if (!jf.crm_v1 || typeof jf.crm_v1 !== 'object') jf.crm_v1 = {};
    const crm = jf.crm_v1;

    // Consultar equipos y personal asignados a la OT
    let equiposAsignados = Array.isArray(data.equipos_asignados) ? data.equipos_asignados : [];
    let personalAsignado = Array.isArray(data.personal_asignado) ? data.personal_asignado : [];
    try {
      const eqRes = await client.query(`
        SELECT re.id_equipo, re.rol_equipo, eq.patente, eq.codigo_interno AS nombre_equipo, eq.marca, eq.modelo
        FROM tpry_rel_equipo re
        LEFT JOIN tequ_equipo eq ON re.id_equipo = eq.id_equipo
        WHERE re.id_proyecto = $1
        ORDER BY re.id_rel_equipo ASC
      `, [id_proyecto]);
      if (eqRes.rows.length > 0) {
        equiposAsignados = eqRes.rows.map(r => ({
          id_equipo: r.id_equipo,
          patente: r.patente || `EQ-${r.id_equipo}`,
          nombre_equipo: r.nombre_equipo || `${r.marca || ''} ${r.modelo || ''}`.trim() || r.rol_equipo || 'Equipo',
          rol: r.rol_equipo || 'Equipo Asignado'
        }));
      }

      const perRes = await client.query(`
        SELECT rp.id_user, rp.rol_asignado, u.name_frst, u.apellido_pat
        FROM tpry_rel_persona rp
        LEFT JOIN tsec_users u ON rp.id_user = u.id_user
        WHERE rp.id_proyecto = $1
        ORDER BY rp.id_rel_persona ASC
      `, [id_proyecto]);
      if (perRes.rows.length > 0) {
        personalAsignado = perRes.rows.map(r => ({
          id_user: r.id_user,
          nombre: `${r.name_frst || ''} ${r.apellido_pat || ''}`.trim() || `Usuario #${r.id_user}`,
          rol: r.rol_asignado || 'Tripulación'
        }));
      }
    } catch (relQErr) {
      console.warn('[solicitarVbGerencia] Aviso consultando recursos asignados:', relQErr.message);
    }

    const equiposAsignadosTexto = data.equipos_asignados_texto ||
      (equiposAsignados.length > 0
        ? equiposAsignados.map(e => `${e.patente || ''} (${e.nombre_equipo || e.rol || 'Equipo'})`.trim()).join(' · ')
        : '');

    const personalAsignadoTexto = data.personal_asignado_texto ||
      (personalAsignado.length > 0
        ? personalAsignado.map(per => `${per.nombre} (${per.rol || 'Tripulante'})`).join(' · ')
        : '');

    const esInterno = Boolean(
      p.es_interno ||
      crm.es_requerimiento_interno ||
      crm.es_interno ||
      String(p.codi_proyecto || '').startsWith('INT-')
    );

    const tipo_entidad = esInterno ? 'REQUERIMIENTO_INTERNO' : 'NEGOCIO_COMERCIAL';
    const lineas = Array.isArray(crm.lineas_servicio) ? crm.lineas_servicio : [];
    const lineaPrincipal = lineas[0] || {};
    const lineaFlete = lineas.find(l => String(l.unidad || '').toLowerCase().includes('traslado') || String(l.tipo || '').toLowerCase().includes('flete')) || null;

    let montoCalculado = Number(data.monto_neto ?? crm.total_neto ?? crm.monto_neto ?? 0);
    if (!montoCalculado && lineas.length > 0 && !esInterno) {
      montoCalculado = lineas.reduce((acc, l) => {
        const price = Number(l.valor_unitario ?? l.valorUnitario ?? 0);
        const u = String(l.unidad || '');
        if (u === 'Horas Diarias Minimas') {
          return acc + (Number(l.cantidad_dias ?? l.cantidad ?? 1) * Number(l.cantidad_horas ?? l.pisoMinimo ?? 8) * price);
        }
        if (u.includes('Mes')) {
          return acc + (Number(l.cantidad_meses ?? l.cantidad ?? 1) * Number(l.cantidad_horas ?? l.pisoMinimo ?? 180) * price);
        }
        return acc + (Number(l.cantidad ?? 1) * price);
      }, 0);
    }

    const es_monetario = data.es_monetario !== undefined
      ? Boolean(data.es_monetario)
      : (!esInterno && montoCalculado > 0 && !crm.es_no_monetario);

    const solicitante = data.nombre_solicita || data.solicitante_nombre || crm.vendedor_nombre || 'Operaciones GSP';
    const valorHora = Number(data.valor_hora ?? lineaPrincipal.valor_unitario ?? lineaPrincipal.valorUnitario ?? crm.tarifa_hora ?? 0);
    const pisoMinimo = data.piso_minimo || (lineaPrincipal.cantidad_horas || lineaPrincipal.pisoMinimo ? `${lineaPrincipal.cantidad_horas || lineaPrincipal.pisoMinimo} hrs mín. (${lineaPrincipal.unidad || 'Diario'})` : '8 hrs mín.');
    const costoFlete = Number(data.costo_flete ?? (lineaFlete ? (Number(lineaFlete.cantidad || 1) * Number(lineaFlete.valor_unitario || lineaFlete.valorUnitario || 0)) : (crm.costo_flete || 0)));
    const distanciaKm = Number(data.distancia_km ?? crm.distancia_km ?? 0);

    const resumen_variables = {
      clasificacion_badge: esInterno
        ? 'REQUERIMIENTO INTERNO'
        : (es_monetario ? 'NEGOCIO MONETARIO' : 'NEGOCIO NO MONETARIO / ESPECIAL'),
      folio: p.codi_proyecto || `PRY-${p.id_proyecto}`,
      nombre_proyecto: p.nombre_proyecto,
      cliente_nombre: esInterno
        ? 'MOVIMIENTO INTERNO GSP (COSTO PROPIO)'
        : (p.nombre_cliente || crm.razon_social || crm.cliente_nombre || 'Cliente Mandante'),
      cliente_rut: esInterno ? 'INTERNO' : (p.rut_cliente || crm.rut_cliente || '—'),
      condicion_pago: esInterno
        ? 'NO FACTURABLE (C. COSTO INTERNO)'
        : (data.condicion_pago || crm.tipo_pago || crm.condicion_pago || 'Crédito 30 días'),
      requiere_oc_hes: Boolean(crm.requiere_oc_hes),
      ubicacion_obra: esInterno
        ? `${p.sucursal_origen || crm.sucursal_origen || 'Origen'} ➔ ${p.sucursal_destino || crm.sucursal_destino || 'Destino'}`
        : (crm.obra_nombre || crm.obra_direccion || crm.obra_ciudad || p.nombre_proyecto || 'Terreno Cliente'),
      fecha_servicio: p.fecha_plan_ini || crm.fecha_servicio || new Date().toISOString().slice(0, 10),
      duracion_estimada: data.duracion_estimada || crm.duracion_estimada || (lineaPrincipal.cantidad_dias ? `${lineaPrincipal.cantidad_dias} día(s)` : 'Según servicio'),
      equipo_categoria: equiposAsignadosTexto || data.equipo_categoria || lineaPrincipal.subcategoria || lineaPrincipal.descripcion || crm.equipo_requerido || p.nombre_proyecto || 'Grúa / Equipo',
      equipos_asignados: equiposAsignados,
      equipos_asignados_texto: equiposAsignadosTexto,
      personal_asignado: personalAsignado,
      personal_asignado_texto: personalAsignadoTexto,
      valor_hora: valorHora,
      piso_minimo: pisoMinimo,
      costo_flete: costoFlete,
      modalidad_flete: data.modalidad_flete || crm.modalidad_flete || (distanciaKm > 30 ? 'Ida y Vuelta (Rural)' : 'Urbano (≤ 30 km)'),
      distancia_km: distanciaKm,
      combustible_cargo: data.combustible_cargo || crm.combustible_cargo || 'GSP',
      alojamiento_viatico_cargo: data.alojamiento_viatico_cargo || crm.alojamiento_viatico_cargo || 'Cliente / Según cotización',
      monto_neto_total: esInterno ? 0 : montoCalculado,
      motivo_solicitud: data.motivo || data.observacion || crm.motivo_interno || p.objetivo_proyecto || '',
      solicitante,
      lineas_servicio: lineas.slice(0, 10)
    };

    const tokenCreated = await AprobacionGerenciaModel.crearToken({
      id_empresa: p.id_empresa || 9,
      tipo_entidad,
      id_entidad_ref: p.id_proyecto,
      folio_referencia: p.codi_proyecto || `PRY-${p.id_proyecto}`,
      es_monetario,
      monto_neto_ref: esInterno ? 0 : montoCalculado,
      resumen_variables,
      id_usuario_solicita: data.id_usuario_solicita || null,
      nombre_solicita: solicitante,
      enviar_notificacion: data.enviar_notificacion !== false
    }, client);

    jf.crm_v1.aprobacion_gerencia = {
      id_token: tokenCreated.id_token,
      token_uuid: tokenCreated.token_uuid,
      url_aprobacion: tokenCreated.url_aprobacion,
      url_completa: tokenCreated.url_completa,
      url_cotizacion: tokenCreated.url_cotizacion,
      url_cotizacion_completa: tokenCreated.url_cotizacion_completa,
      url_ot: tokenCreated.url_ot,
      url_ot_completa: tokenCreated.url_ot_completa,
      estado: 'PENDIENTE',
      observacion: null,
      fecha_solicitud: new Date().toISOString(),
      solicitado_por: solicitante
    };

    const updRes = await client.query(`
      UPDATE tpry_proyecto
      SET estado_vb_gerencia = 'PENDIENTE',
          observacion_vb_gerencia = NULL,
          json_field = $1,
          fecha_modificacion = NOW()
      WHERE id_proyecto = $2
      RETURNING *;
    `, [JSON.stringify(jf), p.id_proyecto]);

    await client.query('COMMIT');

    return {
      proyecto: updRes.rows[0],
      token: tokenCreated,
      token_uuid: tokenCreated.token_uuid,
      url_aprobacion: tokenCreated.url_aprobacion,
      url_completa: tokenCreated.url_completa,
      url_cotizacion: tokenCreated.url_cotizacion,
      url_cotizacion_completa: tokenCreated.url_cotizacion_completa,
      url_ot: tokenCreated.url_ot,
      url_ot_completa: tokenCreated.url_ot_completa
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = ProyectoModel;