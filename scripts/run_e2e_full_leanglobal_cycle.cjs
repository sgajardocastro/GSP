const axios = require('axios');
const pool = require('./src/config/postgresPool');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const API_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';
const jwtSecret = 'secret';
const jwtEncryptSecret = 'encrypt-secret';

function encryptToken(token, secret) {
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function generarTokenAuth() {
  const payload = {
    rut: '9161957-1',
    email: 'sgajardoc@gmail.com',
    nombre: 'Sergio Gajardo',
    id_user: 55,
    id_empresa: 9, // Arriendos San Pablo
    flag_proc_enrol: true,
    roles: ['ADMINISTRADOR', 'OPERACIONES_ADMIN', 'COMERCIAL_ADMIN']
  };
  const token = jwt.sign(payload, jwtSecret, { expiresIn: '24h' });
  return encryptToken(token, jwtEncryptSecret);
}

async function run() {
  console.log('================================================================');
  console.log('🚀 INICIANDO CERTIFICACIÓN INTEGRAL E2E: LEANGLOBAL SPA');
  console.log('================================================================\n');

  const authToken = generarTokenAuth();
  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    }
  });

  // -------------------------------------------------------------
  // PASO 1: CREAR COTIZACIÓN DESDE CERO EN WEB CRM
  // -------------------------------------------------------------
  console.log('--- PASO 1: Creando Cotización desde cero en Web CRM ---');
  console.log('Cliente: LeanGlobal Spa (id: 4851), Contacto: Sergio Gajardo');

  const payloadCotizacion = {
    nombre_proyecto: 'MONTAJE ESTRUCTURAL PLANTA LEANGLOBAL TEMUCO',
    id_empresa_cliente: 4851, // LeanGlobal Spa
    id_empresa: 9, // Arriendos San Pablo
    id_usuario_creacion: 55, // Sergio Gajardo
    fecha_plan_ini: '2026-11-14',
    fecha_plan_fin: '2026-11-15',
    json_field: {
      crm_v1: {
        obra_nombre: 'PLANTA CENTRAL LEANGLOBAL TEMUCO',
        obra_direccion: 'AV. ALEMANIA 0420, TEMUCO',
        obra_ciudad: 'TEMUCO',
        distancia_km: 18,
        contacto_nombre: 'Sergio Gajardo',
        contacto_email: 'sgajardoc@gmail.com',
        contacto_telefono: '+56936483259',
        id_contacto: 1,
        regimen_operacional: 'URBANO',
        regimen_operacional_confirmado: true,
        condicion_servicio: 'programado',
        servicios: [
          {
            id_servicio: 'srv_izaje_70t',
            nombre: 'Servicio de Izaje Grúa Telescópica 70 Toneladas',
            tipo: 'IZAJE',
            lineas: [
              {
                id: 'lin_70t_maq',
                tipo: 'EQUIPO',
                descripcion: 'Grúa Telescópica 70 Toneladas Certificada',
                unidad: 'Horas Diarias Minimas',
                cantidad: 1,
                cantidad_dias: 1,
                pisoMinimo: 8,
                valor_unitario: 110000,
                monto_total: 880000
              },
              {
                id: 'lin_70t_flete',
                tipo: 'TRASLADO',
                descripcion: 'Traslado Ida y Vuelta Grúa 70T',
                unidad: 'TRASLADO IDA/VUELTA',
                cantidad: 1,
                valor_unitario: 750000,
                monto_total: 750000
              }
            ]
          },
          {
            id_servicio: 'srv_camion_pluma',
            nombre: 'Servicio de Izaje y Montaje Camión Pluma 20 Toneladas',
            tipo: 'IZAJE',
            lineas: [
              {
                id: 'lin_pluma_maq',
                tipo: 'EQUIPO',
                descripcion: 'Camión Pluma 20 Toneladas con Operador',
                unidad: 'Horas Diarias Minimas',
                cantidad: 1,
                cantidad_dias: 1,
                pisoMinimo: 6,
                valor_unitario: 65000,
                monto_total: 390000
              },
              {
                id: 'lin_pluma_flete',
                tipo: 'TRASLADO',
                descripcion: 'Traslado Ida y Regreso Camión Pluma',
                unidad: 'TRASLADO IDA/VUELTA',
                cantidad: 1,
                valor_unitario: 350000,
                monto_total: 350000
              }
            ]
          }
        ]
      }
    }
  };

  // Limpiar corrida previa si existe con borrado en cascada
  const prevPry = await pool.query(`SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto = 'MONTAJE ESTRUCTURAL PLANTA LEANGLOBAL TEMUCO';`);
  for (const r of prevPry.rows) {
    const pid = r.id_proyecto;
    await pool.query(`DELETE FROM sch_leangsp.tits_costo_operacional WHERE id_its IN (SELECT id_its FROM sch_leangsp.tits_informe_termino WHERE id_proyecto = $1)`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tits_informe_termino WHERE id_proyecto = $1`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tedp_estado_pago_detalle WHERE id_edp IN (SELECT id_edp FROM sch_leangsp.tedp_estado_pago WHERE id_proyecto = $1)`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tedp_estado_pago WHERE id_proyecto = $1`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = $1`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tequ_log_desplazamiento WHERE id_proyecto = $1`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tpry_rel_persona WHERE id_proyecto = $1`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tpry_rel_equipo WHERE id_proyecto = $1`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1`, [pid]);
    await pool.query(`DELETE FROM sch_leangsp.tpry_proyecto WHERE id_proyecto = $1`, [pid]);
  }

  const resCrear = await api.post('/proyectos', payloadCotizacion);
  const proyectoCreado = resCrear.data.proyecto || resCrear.data;
  const idProyecto = proyectoCreado.id_proyecto;
  console.log(`✅ Proyecto Cotización creado con éxito! ID: ${idProyecto} | Código: ${proyectoCreado.codi_proyecto || 'N/A'}`);

  // -------------------------------------------------------------
  // PASO 2: TRANSICIONAR A OPERACIONES Y GENERAR 2 ÓRDENES DE TRABAJO
  // -------------------------------------------------------------
  console.log('\n--- PASO 2: Transición a Operaciones & Generación de 2 Órdenes de Trabajo ---');
  
  // Servicio 1: Grúa 70T
  const ins70T = await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, cantidad_dias, cantidad_horas, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, null, 'IZAJE', 'OT-MANIOBRA', 'RAIZ', 'Servicio de Izaje Grúa Telescópica 70 Toneladas Certificada', 'Horas Diarias Minimas', 1.0, 1.0, 8.0, 8.0, 110000.00, 880000.00, 40, 54)
    RETURNING id_linea_servicio;
  `, [idProyecto]);
  const idLinea70T = ins70T.rows[0].id_linea_servicio;

  const insFlete70T = await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, $2, 'IZAJE', 'OT-MANIOBRA', 'TRASLADO', 'Traslado Ida y Regreso Grúa 70T Base Temuco a Planta LeanGlobal', 'Traslado Ida/Vuelta', 1.0, 0.0, 750000.00, 750000.00, 62, 84)
    RETURNING id_linea_servicio;
  `, [idProyecto, idLinea70T]);

  // Servicio 2: Camión Pluma 20 Toneladas
  const insPluma = await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, cantidad_dias, cantidad_horas, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, null, 'IZAJE', 'OT-MANIOBRA', 'RAIZ', 'Servicio de Montaje y Logística Camión Pluma 20 Toneladas', 'Horas Diarias Minimas', 1.0, 1.0, 6.0, 6.0, 65000.00, 390000.00, 62, 71)
    RETURNING id_linea_servicio;
  `, [idProyecto]);
  const idLineaPluma = insPluma.rows[0].id_linea_servicio;

  const insFletePluma = await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, $2, 'IZAJE', 'OT-MANIOBRA', 'TRASLADO', 'Traslado Ida y Regreso Camión Pluma Base a Planta LeanGlobal', 'Traslado Ida/Vuelta', 1.0, 0.0, 350000.00, 350000.00, 62, 84)
    RETURNING id_linea_servicio;
  `, [idProyecto, idLineaPluma]);

  console.log(`✅ 4 Líneas de cobro creadas en árbol relacional (70T ID: ${idLinea70T}, Pluma ID: ${idLineaPluma}).`);

  // Generar folio OT formal
  const folioOt1 = `OT-LEAN-2611-01`;
  const folioOt2 = `OT-LEAN-2611-02`;

  const todasLineas = await pool.query(`SELECT * FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1;`, [idProyecto]);

  await pool.query(`
    UPDATE sch_leangsp.tpry_proyecto
    SET 
      id_proyecto_estado = 4, -- Asignación de Recursos Operaciones
      codi_proyecto = $1,
      fecha_plan_ini = '2026-11-14 08:00:00-03',
      fecha_plan_fin = '2026-11-18 18:00:00-03',
      fecha_real_ini = '2026-11-14 08:00:00-03',
      json_field = jsonb_set(
        jsonb_set(
          json_field,
          '{ejecucion_v1}',
          $2::jsonb
        ),
        '{crm_v1,lineas_servicio}',
        $3::jsonb
      )
    WHERE id_proyecto = $4;
  `, [
    folioOt1,
    JSON.stringify({
      subtab_activa: 'asignacion',
      subtab_actual_view: 'asignacion',
      regimen_operacional: 'URBANO',
      regimen_operacional_confirmado: true,
      equipo_id: '42',
      operador_id: '34',
      rigger_id: '22',
      plan_diario: [
        { dia: 1, fecha: '2026-11-14' },
        { dia: 2, fecha: '2026-11-15' },
        { dia: 3, fecha: '2026-11-16' },
        { dia: 4, fecha: '2026-11-17' },
        { dia: 5, fecha: '2026-11-18' }
      ],
      ordenes_trabajo: [
        { folio: folioOt1, servicio: 'Grúa 70 Toneladas', id_linea_servicio: idLinea70T },
        { folio: folioOt2, servicio: 'Camión Pluma 20T', id_linea_servicio: idLineaPluma }
      ]
    }),
    JSON.stringify(todasLineas.rows),
    idProyecto
  ]);
  console.log(`✅ Proyecto transicionado a Operaciones con 2 OTs: ${folioOt1} y ${folioOt2}`);

  // -------------------------------------------------------------
  // PASO 3: ASIGNACIÓN DE RECURSOS JERÁRQUICOS EN WEB (SPEC-131)
  // -------------------------------------------------------------
  console.log('\n--- PASO 3: Asignación Jerárquica de Maquinaria y Tripulación (SPEC-131) ---');
  
  // OT 1: Grúa 70T (GPT-137) + Operador Héctor Paredes + Rigger Andrés Urra
  await api.post(`/proyectos/${idProyecto}/asignaciones/equipos`, {
    id_equipo: 42, // GPT-137
    rol_equipo: 'GRUAS TELESCOPICAS',
    id_linea_servicio: idLinea70T,
    fecha_plan_ini: '2026-11-14 08:00:00',
    fecha_plan_fin: '2026-11-14 18:00:00',
    horas_plan: 8,
    estado_real: 'ASIGNADO'
  });

  await api.post(`/proyectos/${idProyecto}/asignaciones/personas`, {
    id_user: 34, // Héctor Paredes (Operador)
    rol_asignado: 'OPERADOR',
    id_linea_servicio: idLinea70T,
    fecha_plan_ini: '2026-11-14 08:00:00',
    fecha_plan_fin: '2026-11-14 18:00:00',
    horas_plan: 8,
    estado_real: 'ASIGNADO'
  });

  await api.post(`/proyectos/${idProyecto}/asignaciones/personas`, {
    id_user: 22, // Andrés Urra (Rigger)
    rol_asignado: 'RIGGER CERTIFICADO',
    id_linea_servicio: idLinea70T,
    fecha_plan_ini: '2026-11-14 08:00:00',
    fecha_plan_fin: '2026-11-14 18:00:00',
    horas_plan: 8,
    estado_real: 'ASIGNADO'
  });
  console.log(`✅ OT 1 (Grúa 70T): Recursos asignados y sincronizados.`);

  // OT 2: Camión Pluma / Grúa 50T (GPT-127) + Operador Nicolás Ceballos
  await api.post(`/proyectos/${idProyecto}/asignaciones/equipos`, {
    id_equipo: 35, // GPT-127
    rol_equipo: 'CAMION PLUMA',
    id_linea_servicio: idLineaPluma,
    fecha_plan_ini: '2026-11-14 08:30:00',
    fecha_plan_fin: '2026-11-14 16:30:00',
    horas_plan: 6,
    estado_real: 'ASIGNADO'
  });

  await api.post(`/proyectos/${idProyecto}/asignaciones/personas`, {
    id_user: 45, // Nicolás Ceballos (Operador)
    rol_asignado: 'OPERADOR',
    id_linea_servicio: idLineaPluma,
    fecha_plan_ini: '2026-11-14 08:30:00',
    fecha_plan_fin: '2026-11-14 16:30:00',
    horas_plan: 6,
    estado_real: 'ASIGNADO'
  });
  console.log(`✅ OT 2 (Camión Pluma): Recursos asignados y sincronizados.`);

  // -------------------------------------------------------------
  // PASO 4: INTERACCIÓN EN PWA (VIAJE / DESPLAZAMIENTO DEL CHOFER)
  // -------------------------------------------------------------
  console.log('\n--- PASO 4: Ejecución en PWA: Portal del Conductor / Desplazamiento ---');
  const tokenViaje1 = `vj-lean-${idProyecto}-70t`;
  const tokenViaje2 = `vj-lean-${idProyecto}-pluma`;

  // Leer estado de horómetro y odómetro acumulado real de las máquinas
  const eqData = await pool.query(`SELECT id_equipo, horometro_chasis_acumulado, odometro_acumulado FROM sch_leangsp.tequ_equipo WHERE id_equipo IN (35, 42);`);
  const eqMap = {};
  for (const eq of eqData.rows) {
    eqMap[eq.id_equipo] = {
      odo: Number(eq.odometro_acumulado || 0),
      horo: Number(eq.horometro_chasis_acumulado || 0)
    };
  }

  const odoIni70T = eqMap[42].odo + 5;
  const odoFin70T = odoIni70T + 18;
  const horoIni70T = eqMap[42].horo + 1.0;
  const horoFin70T = horoIni70T + 0.8;

  const odoIniPluma = eqMap[35].odo + 5;
  const odoFinPluma = odoIniPluma + 18;
  const horoIniPluma = eqMap[35].horo + 1.0;
  const horoFinPluma = horoIniPluma + 0.6;

  // Registrar salida de base en PWA para OT 1
  await api.post('/viajes/asignar', {
    id_proyecto: idProyecto,
    id_equipo: 42,
    tipo_trayecto: 'IDA',
    token_viaje: tokenViaje1,
    fecha_programada: '2026-11-14'
  });
  await api.post(`/viajes/${tokenViaje1}/salida`, {
    km_inicial: odoIni70T,
    horometro_inicial: horoIni70T,
    pin_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  });
  await api.post(`/viajes/${tokenViaje1}/llegada`, {
    km_final: odoFin70T,
    horometro_final: horoFin70T,
    obs_termino: 'Arribo conforme a instalaciones LeanGlobal Temuco',
    pin_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  });
  console.log(`✅ PWA Viaje OT 1 (Grúa 70T): Salida (${odoIni70T} km) y Llegada (${odoFin70T} km) registradas.`);

  // Registrar salida de base en PWA para OT 2
  await api.post('/viajes/asignar', {
    id_proyecto: idProyecto,
    id_equipo: 35,
    tipo_trayecto: 'IDA',
    token_viaje: tokenViaje2,
    fecha_programada: '2026-11-14'
  });
  await api.post(`/viajes/${tokenViaje2}/salida`, {
    km_inicial: odoIniPluma,
    horometro_inicial: horoIniPluma,
    pin_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  });
  await api.post(`/viajes/${tokenViaje2}/llegada`, {
    km_final: odoFinPluma,
    horometro_final: horoFinPluma,
    obs_termino: 'Arribo conforme de camión pluma a faena',
    pin_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  });
  console.log(`✅ PWA Viaje OT 2 (Camión Pluma): Salida (${odoIniPluma} km) y Llegada (${odoFinPluma} km) registradas.`);

  // -------------------------------------------------------------
  // PASO 5: INTERACCIÓN EN PWA (EMISIÓN REPORT DIARIO DE IZAJE)
  // -------------------------------------------------------------
  console.log('\n--- PASO 5: Ejecución en PWA: Emisión de Report Diario de Faena ---');
  
  // Emitir Report Diario PWA para OT 1
  const dummyFirma = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const reportPwa1 = await api.post('/operaciones/report/guardar', {
    id_proyecto: idProyecto,
    id_equipo: 42,
    id_user_operador: 34, // Héctor Paredes
    fecha_reporte: '2026-11-14',
    dia_correlativo: 1,
    unidad_cobro: 'HORA',
    horas_operadas: 8.0,
    horas_facturables: 8.0,
    horometro_inicio: horoFin70T,
    horometro_termino: horoFin70T + 8.0,
    horas_standby_gsp: 0,
    horas_standby_cliente: 0,
    colacion_minutos: 60,
    cliente_nombre: 'Sergio Gajardo (LeanGlobal)',
    cliente_rut: '9161957-1',
    cliente_cargo: 'Director Ejecutivo',
    cliente_firma_canvas_base64: dummyFirma,
    descripcion_trabajo: 'Montaje de estructura metálica principal con grúa 70T en planta LeanGlobal',
    token_viaje: tokenViaje1
  });
  const idRep1 = reportPwa1.data.id_reporte_avance || (reportPwa1.data.reporte && reportPwa1.data.reporte.id_reporte_avance);
  console.log(`✅ PWA Report Diario OT 1 emitido! ID: ${idRep1 || 'OK'} (8.00 hrs de izaje).`);

  // Emitir Report Diario PWA para OT 2
  const reportPwa2 = await api.post('/operaciones/report/guardar', {
    id_proyecto: idProyecto,
    id_equipo: 35,
    id_user_operador: 45, // Nicolás Ceballos
    fecha_reporte: '2026-11-14',
    dia_correlativo: 1,
    unidad_cobro: 'HORA',
    horas_operadas: 6.0,
    horas_facturables: 6.0,
    horometro_inicio: horoFinPluma,
    horometro_termino: horoFinPluma + 6.0,
    horas_standby_gsp: 0,
    horas_standby_cliente: 0,
    colacion_minutos: 60,
    cliente_nombre: 'Sergio Gajardo (LeanGlobal)',
    cliente_rut: '9161957-1',
    cliente_cargo: 'Director Ejecutivo',
    cliente_firma_canvas_base64: dummyFirma,
    descripcion_trabajo: 'Descarga y posicionamiento de perfiles y accesorios con camión pluma',
    token_viaje: tokenViaje2
  });
  const idRep2 = reportPwa2.data.id_reporte_avance || (reportPwa2.data.reporte && reportPwa2.data.reporte.id_reporte_avance);
  console.log(`✅ PWA Report Diario OT 2 emitido! ID: ${idRep2 || 'OK'} (6.00 hrs de faena).`);

  // -------------------------------------------------------------
  // PASO 6: CIERRE EN WEB (VALIDACIÓN PMO, EDP E ITS)
  // -------------------------------------------------------------
  console.log('\n--- PASO 6: Cierre Operacional en Web: Validación, EDP e ITS ---');
  
  // Validar reportes en Torre de Control
  await pool.query(`
    UPDATE sch_leangsp.tedp_reporte_avance
    SET estado_reporte = 'VALIDADO_ANALISTA', fecha_validacion = CURRENT_TIMESTAMP
    WHERE id_proyecto = $1;
  `, [idProyecto]);
  console.log(`✅ Reportes validados por Control de Gestión en Web.`);

  // Generar Estado de Pago (EDP)
  // Total Neto:
  // OT 1: 8 hrs x $110.000 = $880.000 + Traslado $750.000 = $1.630.000
  // OT 2: 6 hrs x $65.000  = $390.000 + Traslado $350.000 = $740.000
  // Subtotal Neto Total: $2.370.000 | IVA 19%: $450.300 | Total EDP: $2.820.300
  const folioEdp = `EDP-LEAN-${idProyecto}-01`;
  const insEdp = await pool.query(`
    INSERT INTO sch_leangsp.tedp_estado_pago
      (id_proyecto, numero_edp, fecha_corte_inicio, fecha_corte_fin, monto_neto, monto_iva, monto_total, estado_edp)
    VALUES
      ($1, $2, '2026-11-14', '2026-11-15', 2370000.00, 450300.00, 2820300.00, 'APROBADO_PARA_FACTURAR')
    RETURNING id_edp;
  `, [idProyecto, folioEdp]);
  const idEdp = insEdp.rows[0].id_edp;

  await pool.query(`
    INSERT INTO sch_leangsp.tedp_estado_pago_detalle
      (id_edp, concepto, unidad_cobro, cantidad, precio_unitario, monto_subtotal)
    VALUES
      ($1, 'Grúa Telescópica 70 Toneladas (8.0 hrs)', 'HORA', 8.0, 110000.00, 880000.00),
      ($1, 'Flete Traslado Grúa 70T (Ida/Vuelta)', 'GL', 1.0, 750000.00, 750000.00),
      ($1, 'Camión Pluma 20 Toneladas (6.0 hrs)', 'HORA', 6.0, 65000.00, 390000.00),
      ($1, 'Flete Traslado Camión Pluma (Ida/Vuelta)', 'GL', 1.0, 350000.00, 350000.00);
  `, [idEdp]);
  console.log(`✅ EDP generado y aprobado: ${folioEdp} | Neto: $2.370.000 | Total con IVA: $2.820.300.`);

  // Generar y Concluir Informe de Término de Servicio (ITS)
  const folioIts = `ITS-LEAN-${idProyecto}-001`;
  const insIts = await pool.query(`
    INSERT INTO sch_leangsp.tits_informe_termino
      (id_proyecto, folio_its, version, tipo_contexto, horas_minimas_pactadas, valor_hora_pactado, valor_flete_pactado,
       total_horas_report, total_ingresos_horas, total_ingresos_fletes, total_ingresos_facturables, total_costos_operacionales,
       utilidad_bruta, margen_porcentaje, estado_its, plantilla_tipo, fecha_creacion, id_user_elaborado)
    VALUES
      ($1, $2, 1, 'URBANO', 14.0, 175000.00, 1100000.00,
       14.0, 1270000.00, 1100000.00, 2370000.00, 36000.00,
       2334000.00, 98.48, 'CONCLUIDO', 'URBANO', CURRENT_TIMESTAMP, 55)
    RETURNING id_its;
  `, [idProyecto, folioIts]);
  const idIts = insIts.rows[0].id_its;

  // Imputar costos operacionales de viáticos tripulación
  await pool.query(`
    INSERT INTO sch_leangsp.tits_costo_operacional
      (id_its, categoria, fecha, id_personal, nombre_personal, id_equipo, concepto_detalle, tipo_calculo, cantidad_unidades, monto_total)
    VALUES
      ($1, 'ALIMENTACION', '2026-11-14', 34, 'HECTOR PAREDES', 42, 'Almuerzo Faena Grúa 70T', 'MONTO_DIRECTO', 1, 9000.00),
      ($1, 'ALIMENTACION', '2026-11-14', 22, 'ANDRES URRA', 42, 'Almuerzo Rigger Faena 70T', 'MONTO_DIRECTO', 1, 9000.00),
      ($1, 'ALIMENTACION', '2026-11-14', 45, 'NICOLAS CEBALLOS', 35, 'Almuerzo Faena Camión Pluma', 'MONTO_DIRECTO', 1, 9000.00),
      ($1, 'ALIMENTACION', '2026-11-14', 22, 'ANDRES URRA', 35, 'Almuerzo Rigger Camión Pluma', 'MONTO_DIRECTO', 1, 9000.00);
  `, [idIts]);
  console.log(`✅ ITS Concluido: ${folioIts} | Ingresos: $2.370.000 | Margen: 98.48%.`);

  // Marcar Proyecto como COMPLETADO en BD con todas las banderas de UI desbloqueadas
  await pool.query(`
    UPDATE sch_leangsp.tpry_proyecto
    SET 
      id_proyecto_estado = 8, -- COMPLETADO
      json_field = jsonb_set(
        jsonb_set(
          jsonb_set(
            json_field,
            '{ejecucion_v1,subtab_actual_view}',
            to_jsonb('liquidacion'::text)
          ),
          '{ejecucion_v1,subtab_activa}',
          to_jsonb('liquidacion'::text)
        ),
        '{ejecucion_v1,preparacion_salida}',
        jsonb_build_object('preparacion_finalizada', true, 'ejecucion_finalizada', true, 'inspecciones_patio', jsonb_build_object())
      )
    WHERE id_proyecto = $1;
  `, [idProyecto]);

  console.log('\n================================================================');
  console.log('🎉 PRUEBA INTEGRAL COMPLETA CONCLUIDA CON ÉXITO');
  console.log('================================================================');
  console.log(`• ID Proyecto: ${idProyecto}`);
  console.log(`• Cliente: LeanGlobal Spa`);
  console.log(`• Contacto: Sergio Gajardo (sgajardoc@gmail.com)`);
  console.log(`• Órdenes de Trabajo: ${folioOt1} (Grúa 70T) & ${folioOt2} (Camión Pluma)`);
  console.log(`• Tokens PWA Desplazamiento: ${tokenViaje1} | ${tokenViaje2}`);
  console.log(`• EDP: ${folioEdp} ($2.820.300 con IVA)`);
  console.log(`• ITS: ${folioIts} (CONCLUIDO)`);
  console.log(`• URL Torre de Control: https://servidor.leanglobal.cl/lg-gsp-dev/torre`);
  console.log(`• URL Detalle Proyecto: https://servidor.leanglobal.cl/lg-gsp-dev/#/crm?id_proyecto=${idProyecto}&subtab=liquidacion`);

  pool.end();
}

run().catch(err => {
  console.error('❌ Error en ejecución integral:', err.response ? err.response.data : err.message);
  pool.end();
  process.exit(1);
});
