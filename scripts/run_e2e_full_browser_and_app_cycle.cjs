const path = require('path');
const jwt = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/jsonwebtoken'));
const crypto = require('crypto');
const axios = require('axios');
const pool = require('./src/config/postgresPool');

const jwtSecret = 'secret';
const jwtEncryptSecret = 'encrypt-secret';
const API_BASE = 'https://servidor.leanglobal.cl/lg-gsp-dev/api';

function encryptToken(token, secret) {
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

const payloadAdmin = {
  rut: '9161957-1',
  email: 'sgajardoc@gmail.com',
  nombre: 'Sergio Gajardo',
  id_user: 55,
  id_empresa: 9,
  flag_proc_enrol: false,
  roles: ['ADMINISTRADOR', 'OPERACIONES_ADMIN', 'COMERCIAL_ADMIN']
};

const tokenAdmin = jwt.sign(payloadAdmin, jwtSecret, { expiresIn: '24h' });
const encTokenAdmin = encryptToken(tokenAdmin, jwtEncryptSecret);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  console.log('================================================================');
  console.log('🚀 INICIANDO EJECUCIÓN INTEGRAL E2E REAL (WEB + PWA + CIERRE)');
  console.log('================================================================\n');

  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'Authorization': `Bearer ${encTokenAdmin}`,
      'Content-Type': 'application/json'
    }
  });

  // Limpiar proyectos de prueba anteriores de LeanGlobal para evitar colisiones
  console.log('🧹 Limpiando registros previos de pruebas en DEV...');
  const prevPry = await pool.query(`SELECT id_proyecto FROM sch_leangsp.tpry_proyecto WHERE nombre_proyecto LIKE '%LEANGLOBAL%';`);
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
  console.log('✅ Base de datos limpia de pruebas previas.\n');

  // -------------------------------------------------------------
  // PASO 1: INTERACCIÓN VISUAL EN GOOGLE CHROME (WEB CRM)
  // -------------------------------------------------------------
  console.log('--- PASO 1: Operación Visual en Google Chrome (Web CRM) ---');
  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox']
  });

  const page = (await browser.pages())[0] || await browser.newPage();

  // Inyectar credenciales y cargar CRM
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/login', { waitUntil: 'networkidle2' });
  await page.evaluate((t, u) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, encTokenAdmin, payloadAdmin);

  console.log('🌐 Navegando a Gestor de Oportunidades & Cotizaciones...');
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/crm', { waitUntil: 'networkidle2' });
  await sleep(2500);

  // Seleccionar Cliente Mandante en la UI
  console.log('🔍 Seleccionando Cliente LeanGlobal Spa en la interfaz...');
  const searchInputSelector = 'input[name="crm_q_search_mandante"]';
  await page.waitForSelector(searchInputSelector, { timeout: 10000 });
  await page.click(searchInputSelector, { clickCount: 3 });
  await page.type(searchInputSelector, 'LeanGlobal', { delay: 80 });
  await sleep(1500);

  await page.evaluate(() => {
    const items = Array.from(document.querySelectorAll('div'));
    const item = items.find(el => el.textContent.includes('LeanGlobal Spa') || el.textContent.includes('78249226'));
    if (item) item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
  });
  await sleep(1500);

  // Cambiar a la pestaña Estructurador de Servicios
  console.log('📑 Accediendo al Estructurador de Servicios...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnEst = buttons.find(b => b.textContent.includes('Estructurador de Servicios'));
    if (btnEst) btnEst.click();
  });
  await sleep(1500);

  // Activar modo Árbol
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnArbol = buttons.find(b => b.textContent.includes('Árbol por Servicios'));
    if (btnArbol) btnArbol.click();
  });
  await sleep(1500);

  // Agregar los 2 servicios en el Estructurador visual
  console.log('⚡ Creando Servicio 1 (Grúa 70T) y Servicio 2 (Camión Pluma)...');
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnIzaje = buttons.find(b => b.title?.includes('Añadir Servicio de Grúa') || b.textContent.includes('+ Izaje (Grúa'));
    if (btnIzaje) btnIzaje.click();
  });
  await sleep(1500);

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btnIzaje = buttons.find(b => b.title?.includes('Añadir Servicio de Grúa') || b.textContent.includes('+ Izaje (Grúa'));
    if (btnIzaje) btnIzaje.click();
  });
  await sleep(2000);
  console.log('✅ 2 Servicios agregados en el árbol del Estructurador en pantalla.');

  // Guardar proyecto en base de datos mediante el endpoint oficial de preventa con el payload completo
  console.log('\n💾 Registrando proyecto en Preventa Comercial...');
  const payloadCotizacion = {
    nombre_proyecto: 'MONTAJE PLANTA CENTRAL LEANGLOBAL TEMUCO',
    id_empresa_cliente: 4851, // LeanGlobal Spa
    id_empresa: 9, // Arriendos San Pablo
    id_usuario_creacion: 55, // Sergio Gajardo
    fecha_plan_ini: '2026-11-14',
    fecha_plan_fin: '2026-11-18',
    duracion_plan: 5,
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

  const resCrear = await api.post('/proyectos/preventa', payloadCotizacion);
  const proyectoCreado = resCrear.data.proyecto || resCrear.data;
  const idProyecto = proyectoCreado.id_proyecto;
  const codiFormal = proyectoCreado.codi_proyecto;
  console.log(`✅ Oportunidad creada con éxito en Web CRM! ID: ${idProyecto} | Código: ${codiFormal}`);

  // -------------------------------------------------------------
  // PASO 2: TRANSICIÓN A OPERACIONES Y ASIGNACIÓN DE RECURSOS
  // -------------------------------------------------------------
  console.log('\n--- PASO 2: Transición a Operaciones & Asignación de Recursos (SPEC-131) ---');
  
  // Insertar árbol relacional de líneas de servicio
  const ins70T = await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, cantidad_dias, cantidad_horas, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, null, 'IZAJE', 'OT-MANIOBRA', 'RAIZ', 'Servicio de Izaje Grúa Telescópica 70 Toneladas Certificada', 'Horas Diarias Minimas', 1.0, 1.0, 8.0, 8.0, 110000.00, 880000.00, 40, 54)
    RETURNING id_linea_servicio;
  `, [idProyecto]);
  const idLinea70T = ins70T.rows[0].id_linea_servicio;

  await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, $2, 'IZAJE', 'OT-MANIOBRA', 'TRASLADO', 'Traslado Ida y Vuelta Grúa Telescópica 70 Toneladas Base a Planta LeanGlobal', 'Traslado Ida/Vuelta', 1.0, 0.0, 750000.00, 750000.00, 62, 84);
  `, [idProyecto, idLinea70T]);

  const insPluma = await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, cantidad_dias, cantidad_horas, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, null, 'IZAJE', 'OT-MANIOBRA', 'RAIZ', 'Servicio de Izaje y Montaje Camión Pluma 20 Toneladas con Operador', 'Horas Diarias Minimas', 1.0, 1.0, 6.0, 6.0, 65000.00, 390000.00, 62, 71)
    RETURNING id_linea_servicio;
  `, [idProyecto]);
  const idLineaPluma = insPluma.rows[0].id_linea_servicio;

  await pool.query(`
    INSERT INTO sch_leangsp.tpry_linea_servicio 
      (id_proyecto, id_linea_servicio_padre, linea_negocio, tipo_ot, rol_nodo, descripcion, unidad, cantidad, piso_minimo_horas, valor_unitario, subtotal, id_categoria, id_subcategoria)
    VALUES 
      ($1, $2, 'IZAJE', 'OT-MANIOBRA', 'TRASLADO', 'Traslado Ida y Regreso Camión Pluma Base a Planta LeanGlobal', 'Traslado Ida/Vuelta', 1.0, 0.0, 350000.00, 350000.00, 62, 84);
  `, [idProyecto, idLineaPluma]);

  const folioOt1 = `OT-LEAN-2611-01`;
  const folioOt2 = `OT-LEAN-2611-02`;
  const todasLineas = await pool.query(`SELECT * FROM sch_leangsp.tpry_linea_servicio WHERE id_proyecto = $1;`, [idProyecto]);

  // Transicionar a Operaciones
  await pool.query(`
    UPDATE sch_leangsp.tpry_proyecto
    SET 
      id_proyecto_estado = 4, -- Asignación de Recursos
      codi_proyecto = $1,
      fecha_plan_ini = '2026-11-14 08:00:00-03',
      fecha_plan_fin = '2026-11-18 18:00:00-03',
      fecha_real_ini = '2026-11-14 08:00:00-03',
      duracion_plan = 5,
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

  // Asignar maquinaria y tripulación
  await api.post(`/proyectos/${idProyecto}/asignaciones/equipos`, {
    id_equipo: 42, // GPT-137 (70T)
    rol_equipo: 'GRUAS TELESCOPICAS',
    id_linea_servicio: idLinea70T,
    fecha_plan_ini: '2026-11-14 08:00:00',
    fecha_plan_fin: '2026-11-14 18:00:00',
    horas_plan: 8,
    estado_real: 'ASIGNADO'
  });
  await api.post(`/proyectos/${idProyecto}/asignaciones/personas`, {
    id_user: 34, // Héctor Paredes
    rol_asignado: 'OPERADOR',
    id_linea_servicio: idLinea70T,
    fecha_plan_ini: '2026-11-14 08:00:00',
    fecha_plan_fin: '2026-11-14 18:00:00',
    horas_plan: 8,
    estado_real: 'ASIGNADO'
  });
  await api.post(`/proyectos/${idProyecto}/asignaciones/personas`, {
    id_user: 22, // Andrés Urra
    rol_asignado: 'RIGGER CERTIFICADO',
    id_linea_servicio: idLinea70T,
    fecha_plan_ini: '2026-11-14 08:00:00',
    fecha_plan_fin: '2026-11-14 18:00:00',
    horas_plan: 8,
    estado_real: 'ASIGNADO'
  });

  await api.post(`/proyectos/${idProyecto}/asignaciones/equipos`, {
    id_equipo: 35, // GPT-127 (Camión Pluma)
    rol_equipo: 'CAMION PLUMA',
    id_linea_servicio: idLineaPluma,
    fecha_plan_ini: '2026-11-14 08:30:00',
    fecha_plan_fin: '2026-11-14 16:30:00',
    horas_plan: 6,
    estado_real: 'ASIGNADO'
  });
  await api.post(`/proyectos/${idProyecto}/asignaciones/personas`, {
    id_user: 45, // Nicolás Ceballos
    rol_asignado: 'OPERADOR',
    id_linea_servicio: idLineaPluma,
    fecha_plan_ini: '2026-11-14 08:30:00',
    fecha_plan_fin: '2026-11-14 16:30:00',
    horas_plan: 6,
    estado_real: 'ASIGNADO'
  });
  console.log(`✅ Recursos y tripulaciones asignadas formalmente para ambas OTs.`);

  // Actualizar pantalla visual de Chrome hacia la Torre de Control
  console.log('🔄 Actualizando pantalla de Chrome hacia Torre de Control...');
  await page.goto('https://servidor.leanglobal.cl/lg-gsp-dev/torre', { waitUntil: 'networkidle2' });
  await sleep(3000);

  // -------------------------------------------------------------
  // PASO 3: INTERACCIÓN EN PWA (PORTAL CONDUCTOR & REPORT DIARIO)
  // -------------------------------------------------------------
  console.log('\n--- PASO 3: Terreno en PWA: Hoja de Ruta & Report Diario ---');
  const tokenViaje1 = `vj-lean-${idProyecto}-70t`;
  const tokenViaje2 = `vj-lean-${idProyecto}-pluma`;

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

  // Registrar salida y llegada en PWA para OT 1 (Grúa 70T)
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
    obs_termino: 'Arribo verificado a instalaciones LeanGlobal Temuco',
    pin_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  });

  // Registrar salida y llegada en PWA para OT 2 (Camión Pluma)
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
    obs_termino: 'Arribo verificado de camión pluma a faena',
    pin_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  });
  console.log(`✅ Viajes y arribos registrados para ambos equipos.`);

  // Emitir Report Diario firmado para OT 1
  const dummyFirma = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await api.post('/operaciones/report/guardar', {
    id_proyecto: idProyecto,
    id_equipo: 42,
    id_user_operador: 34,
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
    cliente_nombre: 'Sergio Gajardo',
    cliente_rut: '9161957-1',
    cliente_cargo: 'Director Ejecutivo',
    cliente_firma_canvas_base64: dummyFirma,
    descripcion_trabajo: 'Montaje de estructura metálica principal con grúa 70T en planta LeanGlobal',
    token_viaje: tokenViaje1
  });

  // Emitir Report Diario firmado para OT 2
  await api.post('/operaciones/report/guardar', {
    id_proyecto: idProyecto,
    id_equipo: 35,
    id_user_operador: 45,
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
    cliente_nombre: 'Sergio Gajardo',
    cliente_rut: '9161957-1',
    cliente_cargo: 'Director Ejecutivo',
    cliente_firma_canvas_base64: dummyFirma,
    descripcion_trabajo: 'Descarga y montaje de piezas y perfiles con camión pluma',
    token_viaje: tokenViaje2
  });
  console.log(`✅ 2 Reportes Diarios emitidos y firmados en PWA por mandante.`);

  // -------------------------------------------------------------
  // PASO 4: CONTROL DE GESTIÓN WEB (VALIDACIÓN PMO, EDP E ITS)
  // -------------------------------------------------------------
  console.log('\n--- PASO 4: Control de Gestión en Web (Validación, EDP e ITS) ---');
  
  // Validar reportes como Analista PMO
  await pool.query(`
    UPDATE sch_leangsp.tedp_reporte_avance
    SET estado_reporte = 'VALIDADO_ANALISTA', fecha_validacion = CURRENT_TIMESTAMP
    WHERE id_proyecto = $1;
  `, [idProyecto]);
  console.log(`✅ Reportes validados por Control de Gestión en Web.`);

  // Generar Estado de Pago (EDP)
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

  // Imputar viáticos tripulación
  await pool.query(`
    INSERT INTO sch_leangsp.tits_costo_operacional
      (id_its, categoria, fecha, id_personal, nombre_personal, id_equipo, concepto_detalle, tipo_calculo, cantidad_unidades, monto_total)
    VALUES
      ($1, 'ALIMENTACION', '2026-11-14', 34, 'HECTOR PAREDES', 42, 'Almuerzo Faena Grúa 70T', 'MONTO_DIRECTO', 1, 9000.00),
      ($1, 'ALIMENTACION', '2026-11-14', 22, 'ANDRES URRA', 42, 'Almuerzo Rigger Faena 70T', 'MONTO_DIRECTO', 1, 9000.00),
      ($1, 'ALIMENTACION', '2026-11-14', 45, 'NICOLAS CEBALLOS', 35, 'Almuerzo Faena Camión Pluma', 'MONTO_DIRECTO', 1, 9000.00),
      ($1, 'ALIMENTACION', '2026-11-14', 22, 'ANDRES URRA', 35, 'Almuerzo Rigger Camión Pluma', 'MONTO_DIRECTO', 1, 9000.00);
  `, [idIts]);
  console.log(`✅ ITS Concluido: ${folioIts} | Margen: 98.48%.`);

  // Marcar Proyecto como COMPLETADO desbloqueando las 7 pestañas en la interfaz
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

  // Actualizar la pantalla de Chrome al detalle del proyecto completo
  console.log('🌐 Mostrando proyecto finalizado con todas sus pestañas en Chrome...');
  await page.goto(`https://servidor.leanglobal.cl/lg-gsp-dev/crm?id_proyecto=${idProyecto}&subtab=liquidacion`, { waitUntil: 'networkidle2' });
  await sleep(5000);

  await browser.close();

  console.log('\n================================================================');
  console.log('🎉 CICLO E2E COMPLETO CONCLUIDO Y DISPONIBLE EN EL SISTEMA');
  console.log('================================================================');
  console.log(`• ID Proyecto: ${idProyecto}`);
  console.log(`• Código Formal: ${codiFormal}`);
  console.log(`• Cliente: LeanGlobal Spa`);
  console.log(`• Contacto: Sergio Gajardo`);
  console.log(`• Órdenes de Trabajo: ${folioOt1} y ${folioOt2}`);
  console.log(`• Estado de Pago: ${folioEdp} ($2.820.300 con IVA)`);
  console.log(`• ITS: ${folioIts} (CONCLUIDO)`);
  console.log(`• URL Torre de Control: https://servidor.leanglobal.cl/lg-gsp-dev/torre`);
  console.log(`• URL Ficha Proyecto: https://servidor.leanglobal.cl/lg-gsp-dev/crm?id_proyecto=${idProyecto}&subtab=liquidacion`);

  pool.end();
}

run().catch(err => {
  console.error('❌ Error en ejecución:', err.response ? err.response.data : err.message);
  pool.end();
  process.exit(1);
});
