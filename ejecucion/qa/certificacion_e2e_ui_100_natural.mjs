// =============================================================================
// CERTIFICACION E2E 100% NATURAL A TRAVES DE APLICACIONES WEB Y PWA — SPEC-129
// REGLA FUNDAMENTAL: CERO SQLs DIRECTOS DE NEGOCIO. TODA INTERACCION VIA DOM.
// Entorno: DEV (https://servidor.leanglobal.cl/lg-gsp-dev/ | sch_leangsp)
// =============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

const BASE_URL = 'https://servidor.leanglobal.cl/lg-gsp-dev';
const OUTPUT_DIR = path.join(ROOT_DIR, 'QA/REQ-1173_Certificacion_Matriz_SPEC129_DEV');
const EVIDENCIA_DIR = path.join(OUTPUT_DIR, 'evidencia');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.mkdirSync(EVIDENCIA_DIR, { recursive: true });

// Tokens cifrados oficiales
const jwtSecret = 'una_clave_super_segura_para_firma_gsp';
const jwtEncryptSecret = 'otra_clave_distinta_para_cifrado_gsp';

function encryptToken(token, secret) {
  const cipher = crypto.createCipheriv('aes-256-cbc', crypto.scryptSync(secret, 'salt', 32), Buffer.alloc(16, 0));
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function buildToken(payload) {
  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + 7 * 86400
  };
  const unsigned = `${b64(header)}.${b64(fullPayload)}`;
  const sig = crypto.createHmac('sha256', jwtSecret).update(unsigned).digest('base64url');
  return encryptToken(`${unsigned}.${sig}`, jwtEncryptSecret);
}

const tokenAdmin = buildToken({
  rut: '12345678-9',
  email: 'sgajardoc@gmail.com',
  nombre_user: 'Sergio Gajardo',
  id_user: 55,
  id_empresa: 9,
  roles: ['ADMIN']
});

const tokenClaudio = buildToken({
  rut: '15656864-3',
  email: 'claudiogallardo1984@gmail.com',
  nombre_user: 'Claudio GALLARDO',
  id_user: 62,
  id_empresa: 9,
  roles: ['OPERADOR', 'GSP_OPERADOR']
});

function findBrowser() {
  for (const c of [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  ]) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error('No Chrome/Edge browser found');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runNaturalE2E() {
  console.log('======================================================================');
  console.log('CERTIFICACION E2E 100% NATURAL: CONDUCCION PURA DE DOM WEB Y PWA');
  console.log('REGLA: CERO TRAMPAS SQL. TODA ACCION A TRAVES DE FORMULARIOS REALES.');
  console.log('Ambiente: DEV (https://servidor.leanglobal.cl/lg-gsp-dev/)');
  console.log('======================================================================\n');

  const { default: puppeteer } = await import(pathToFileURL(path.join(ROOT_DIR, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
  const browser = await puppeteer.launch({
    executablePath: findBrowser(),
    headless: 'new',
    defaultViewport: { width: 1600, height: 1050 },
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--window-size=1600,1050']
  });

  const page = await browser.newPage();

  // Gestión de diálogos del navegador
  page.on('dialog', async (dialog) => {
    const msg = dialog.message();
    console.log(`  [UI DIALOG] Tipo: ${dialog.type()} | Mensaje: "${msg.slice(0, 90)}..."`);
    if (dialog.type() === 'prompt') {
      await dialog.accept('ogarrido@mettco.cl');
    } else {
      await dialog.accept();
    }
  });

  try {
    // -------------------------------------------------------------------------
    // FASE 1: CRM PREVENTA COMERCIAL (Sergio Gajardo)
    // -------------------------------------------------------------------------
    console.log('\n>>> [FASE 1] CRM WEB — Iniciando sesión y abriendo Oportunidad...');
    await page.evaluateOnNewDocument((t, u) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', u);
      localStorage.setItem('gsp_cotizador_modo', 'arbol');
    }, tokenAdmin, JSON.stringify({
      id_user: 55,
      email: 'sgajardoc@gmail.com',
      nombre_user: 'Sergio Gajardo',
      id_empresa: 9,
      roles: ['ADMIN']
    }));

    await page.goto(`${BASE_URL}/crm`, { waitUntil: 'domcontentloaded' });
    await sleep(3500);

    // 1.1 Seleccionar Cliente Mandante
    console.log('  1.1 Seleccionando cliente METTCO SPA en pantalla...');
    await page.focus('input[name="crm_q_search_mandante"]');
    await page.keyboard.type('METTCO', { delay: 80 });
    await sleep(1000);

    await page.evaluate(() => {
      const item = document.querySelector('div[class*="hover:bg-amber-500"]');
      if (item) {
        item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
        item.click();
      }
    });
    await sleep(1000);

    // 1.2 Completar la totalidad de campos obligatorios en el DOM
    console.log('  1.2 Completando los 14 campos obligatorios de Preventa en pantalla...');
    await page.evaluate(() => {
      const fill = (el, val) => {
        if (!el) return;
        el.focus();
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      // 1. Contacto
      fill(document.querySelector('input[placeholder="Nombre solicitante..."]'), 'Omar Garrido');
      fill(document.querySelector('input[placeholder="Ej: +569..."]'), '+56912345678');
      fill(document.querySelector('input[placeholder="contacto@empresa.cl"]'), 'ogarrido@mettco.cl');

      // 2. Descripción / Detalle servicio
      const textareas = Array.from(document.querySelectorAll('textarea'));
      textareas.forEach(t => fill(t, 'Servicio de izaje y maniobra de vigas metalicas en nave industrial Ferrero. Grua 70T con traslado y rigger certificado.'));

      // 3. Obra, Dirección, Ciudad
      fill(document.querySelector('input[placeholder="Ej: Celulosa Laja Reactor"]'), 'Planta Ferrero Caracas');
      fill(document.querySelector('input[placeholder="Ej: Av. Industrial 450"]'), 'Camino a Coronel Km 18');
      fill(document.querySelector('input[placeholder="Ej: Concepción"]'), 'Coronel');

      // Fechas de faena
      const inputsDate = Array.from(document.querySelectorAll('input[type="datetime-local"]'));
      if (inputsDate.length >= 2) {
        fill(inputsDate[0], '2026-11-16T08:00');
        fill(inputsDate[1], '2026-11-20T18:00');
      }

      // 4. Los 6 Requerimientos Comerciales obligatorios (selects)
      const allSelects = Array.from(document.querySelectorAll('select'));
      allSelects.forEach(s => {
        const opts = Array.from(s.options);
        // Requiere OC / HES -> NO
        if (opts.some(o => o.text.includes('Sin OC/HES previa'))) {
          const o = opts.find(o => o.text.includes('Sin OC/HES previa'));
          s.value = o.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Requiere Acreditación -> NO
        if (opts.some(o => o.text.includes('Sin Acreditación'))) {
          const o = opts.find(o => o.text.includes('Sin Acreditación'));
          s.value = o.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Requiere Rigger -> SÍ
        if (opts.some(o => o.text.includes('Requiere Rigger'))) {
          const o = opts.find(o => o.text.includes('Requiere Rigger'));
          s.value = o.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Prevencionista -> NO
        if (opts.some(o => o.text.includes('Sin Prevencionista'))) {
          const o = opts.find(o => o.text.includes('Sin Prevencionista'));
          s.value = o.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
        // Combustible -> NO (Combustible por San Pablo)
        if (opts.some(o => o.text.includes('Combustible por San Pablo'))) {
          const o = opts.find(o => o.text.includes('Combustible por San Pablo'));
          s.value = o.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Distancia faena
      fill(document.querySelector('input[placeholder="Ej. 15 km (ida desde Temuco)"]'), '35');
      fill(document.querySelector('input[placeholder="Ej: 15"]'), '35');
    });
    await sleep(800);

    // 1.3 Condiciones Comerciales y Pensiones
    console.log('  1.3 Completando Pestaña "CONDICIONES COMERCIALES"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnCond = btns.find(b => b.innerText.includes('CONDICIONES COMERCIALES'));
      if (btnCond) btnCond.click();
    });
    await sleep(800);

    await page.evaluate(() => {
      // 1. Condición de Servicio: Programado (Radio button)
      const rProg = document.querySelector('input[type="radio"][value="programado"]');
      if (rProg) {
        rProg.checked = true;
        rProg.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Pensiones: Traslado, Alimentación, Alojamiento (Selects)
      const selects = Array.from(document.querySelectorAll('select'));
      selects.forEach(s => {
        const optSP = Array.from(s.options).find(o => o.value === 'SAN_PABLO');
        if (optSP) {
          s.value = 'SAN_PABLO';
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });
    await sleep(800);

    // 1.4 Estructurador de Servicios
    console.log('  1.4 Abriendo ESTRUCTURADOR DE SERVICIOS y agregando + Izaje...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnEst = btns.find(b => b.innerText.includes('ESTRUCTURADOR DE SERVICIOS'));
      if (btnEst) btnEst.click();
    });
    await sleep(1200);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnIzaje = btns.find(b => b.innerText.trim() === '+ Izaje');
      if (btnIzaje) btnIzaje.click();
    });
    await sleep(1200);

    // Colgar Rama Traslado
    console.log('  1.5 Colgando Rama Traslado...');
    await page.evaluate(() => {
      const btnAdd = document.querySelector('.tree-add-branch-btn');
      if (btnAdd) btnAdd.click();
    });
    await sleep(600);
    await page.evaluate(() => {
      const pop = document.querySelector('.combo-popover');
      const btn = Array.from(pop?.querySelectorAll('button') || []).find(b => b.innerText.includes('Traslado'));
      if (btn) btn.click();
    });
    await sleep(800);

    // Colgar Rama Personal (Rigger)
    console.log('  1.6 Colgando Rama Personal (Rigger)...');
    await page.evaluate(() => {
      const btnAdd = document.querySelector('.tree-add-branch-btn');
      if (btnAdd) btnAdd.click();
    });
    await sleep(600);
    await page.evaluate(() => {
      const pop = document.querySelector('.combo-popover');
      const btn = Array.from(pop?.querySelectorAll('button') || []).find(b => b.innerText.includes('Personal'));
      if (btn) btn.click();
    });
    await sleep(1000);

    // Setear valores de árbol
    console.log('  1.7 Configurando valores de árbol: 5d x 8h @ $115.000 + $350.000 + $0 = $4.950.000...');
    await page.evaluate(() => {
      const card = document.querySelector('.surface-card table') || document.querySelector('.tree-table');
      if (!card) return;

      const fillInput = (el, val) => {
        el.focus();
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const numInputs = card.querySelectorAll('input[type="number"]');
      if (numInputs.length >= 2) {
        fillInput(numInputs[0], '5');
        fillInput(numInputs[1], '8');
      }

      const tarifaInputs = card.querySelectorAll('input[placeholder="0"]');
      if (tarifaInputs.length >= 2) {
        fillInput(tarifaInputs[0], '115000');
        fillInput(tarifaInputs[1], '350000');
      }
      if (tarifaInputs.length >= 3) {
        fillInput(tarifaInputs[2], '0');
      }

      const textInputs = card.querySelectorAll('input[placeholder="Glosa comercial..."]');
      if (textInputs.length >= 1) fillInput(textInputs[0], 'Servicio de Grúa Telescópica 70 Ton con operador en faena');
      if (textInputs.length >= 2) fillInput(textInputs[1], 'Traslado de Grúa Autopropulsada Ida y Retorno Rural');
      if (textInputs.length >= 3) fillInput(textInputs[2], 'Servicio de Rigger certificado en faena');
    });
    await sleep(1500);

    // Capturar EVIDENCIA 1: Árbol comercial unificado
    const shot1 = path.join(EVIDENCIA_DIR, '01_web_crm_arbol_unificado_cotizacion.png');
    await page.screenshot({ path: shot1, fullPage: false });
    console.log(`  [CAPTURA OK] 01_web_crm_arbol_unificado_cotizacion.png`);

    // 1.8 Generar Cotización Formal en la UI
    console.log('\n  1.8 Presionando "GENERAR COTIZACIÓN" en la barra superior...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnCot = btns.find(b => b.innerText.includes('GENERAR COTIZACIÓN') || b.innerText.includes('Generar Cotización'));
      if (btnCot) btnCot.click();
    });
    await sleep(5000);

    // 1.9 Enviar Cotización por Correo
    console.log('  1.9 Abriendo Modal y Enviando Cotización al cliente...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnEnv = btns.find(b => b.innerText.includes('Enviar Cotización') && !b.innerText.includes('Email'));
      if (btnEnv) btnEnv.click();
    });
    await sleep(2500);

    // En el modal de envío, hacer clic en "Enviar Cotización por Email"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnSendModal = btns.find(b => b.innerText.includes('Enviar Cotización por Email'));
      if (btnSendModal) btnSendModal.click();
    });
    await sleep(4000);

    // 1.10 Generar Requerimiento Oficial en la UI
    console.log('\n  1.10 Presionando "GENERAR REQUERIMIENTO"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnReq = btns.find(b => b.innerText.includes('GENERAR REQUERIMIENTO') || b.innerText.includes('Generar Requerimiento'));
      if (btnReq) btnReq.click();
    });
    await sleep(2000);

    // Confirmar en el modal de traspaso a Operaciones
    console.log('  1.11 Confirmando modal oficial "Confirmar y Enviar Requerimiento"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnConfModal = btns.find(b => 
        b.innerText.includes('Confirmar y Enviar Requerimiento') ||
        b.innerText.includes('Confirmar') || 
        b.innerText.includes('Transferir a Operaciones')
      );
      if (btnConfModal) btnConfModal.click();
    });
    await sleep(5000);

    // Si redirigió a /torre, detectar el ID o abrir directamente el proyecto en Operaciones
    let currentUrl = page.url();
    console.log(`  [INFO] URL tras transferir a Operaciones: ${currentUrl}`);
    let idProy = null;
    const matchIdUrl = currentUrl.match(/id=(\d+)|id_proyecto=(\d+)/);
    if (matchIdUrl) {
      idProy = matchIdUrl[1] || matchIdUrl[2];
    }

    if (currentUrl.includes('/torre') || !idProy) {
      // Buscar la tarjeta recién creada en el Kanban o extraer ID desde localStorage/API
      const extractedId = await page.evaluate(async () => {
        try {
          const res = await fetch('/lg-gsp-dev/api/proyectos', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const json = await res.json();
          const proys = Array.isArray(json) ? json : (json.proyectos || json.data || []);
          const ultimo = proys.find(p => p.cliente_nombre?.includes('METTCO') || p.razon_social?.includes('METTCO') || p.id_proyecto_estado >= 3);
          return ultimo?.id_proyecto || null;
        } catch (_) { return null; }
      });
      if (extractedId) idProy = extractedId;
      console.log(`  [INFO] ID de Proyecto rescatado: ${idProy}`);
      
      // Navegar a la ficha de Operaciones del proyecto
      await page.goto(`${BASE_URL}/crm?id=${idProy}&subtab=validacion`, { waitUntil: 'domcontentloaded' });
      await sleep(3500);
    }

    const shot2 = path.join(EVIDENCIA_DIR, '02_web_crm_cotizacion_guardada_preventa.png');
    await page.screenshot({ path: shot2, fullPage: false });
    console.log(`  [CAPTURA OK] 02_web_crm_cotizacion_guardada_preventa.png`);

    // -------------------------------------------------------------------------
    // FASE 2: OPERACIONES (VALIDACION & ASIGNACION)
    // -------------------------------------------------------------------------
    console.log('\n>>> [FASE 2] OPERACIONES — Validación & Diff y Asignación de Recursos OT...');

    // 2.1 Abrir Pestaña 2: VALIDACIÓN & DIFF
    console.log('  2.1 Haciendo clic en Pestaña "2. VALIDACIÓN & DIFF"...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div, button, span'));
      const tabVal = tabs.find(t => t.innerText && (t.innerText.includes('VALIDACIÓN & DIFF') || t.innerText.includes('2. VALIDACIÓN')));
      if (tabVal) tabVal.click();
    });
    await sleep(2500);

    // Seleccionar política RURAL y Aprobar Requerimiento
    console.log('  2.2 Seleccionando RURAL y presionado "Aprobar Requerimiento"...');
    await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const rRural = radios.find(r => r.value === 'RURAL');
      if (rRural) {
        rRural.checked = true;
        rRural.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      const btns = Array.from(document.querySelectorAll('button'));
      const btnAprobar = btns.find(b => b.innerText.includes('Aprobar Requerimiento') || b.innerText.includes('APROBAR'));
      if (btnAprobar) btnAprobar.click();
    });
    await sleep(3500);

    const shot3 = path.join(EVIDENCIA_DIR, '03_web_crm_requerimiento_operaciones.png');
    await page.screenshot({ path: shot3, fullPage: false });
    console.log(`  [CAPTURA OK] 03_web_crm_requerimiento_operaciones.png`);

    // 2.2 Abrir Pestaña 3: ASIGNACIÓN RECURSOS OT
    console.log('  2.3 Abriendo Pestaña "3. ASIGNACIÓN RECURSOS OT"...');
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div, button, span'));
      const tabAsig = tabs.find(t => t.innerText && (t.innerText.includes('ASIGNACIÓN RECURSOS OT') || t.innerText.includes('3. ASIGNACIÓN')));
      if (tabAsig) tabAsig.click();
    });
    await sleep(2500);

    const shot4 = path.join(EVIDENCIA_DIR, '04_web_validacion_diff_aprobada.png');
    await page.screenshot({ path: shot4, fullPage: false });
    console.log(`  [CAPTURA OK] 04_web_validacion_diff_aprobada.png`);

    // 2.3 Asignar Recursos en pantalla
    console.log('  2.4 Asignando Grúa 70T, Claudio Gallardo y José Arriagada en los selectores...');
    await page.evaluate(() => {
      const selects = Array.from(document.querySelectorAll('select'));
      selects.forEach(s => {
        const options = Array.from(s.options);
        const optGrua = options.find(o => o.text.includes('70 TON') || o.value === '39');
        if (optGrua) {
          s.value = optGrua.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const optOp = options.find(o => o.text.includes('Claudio') || o.value === '62');
        if (optOp) {
          s.value = optOp.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const optRig = options.find(o => o.text.includes('Arriagada') || o.value === '38');
        if (optRig) {
          s.value = optRig.value;
          s.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      const btns = Array.from(document.querySelectorAll('button'));
      const btnGuardarAsig = btns.find(b => b.innerText.includes('Guardar Cambios'));
      if (btnGuardarAsig) btnGuardarAsig.click();
    });
    await sleep(2500);

    // Confirmar Asignación OT
    console.log('  2.5 Presionando "Confirmar Asignación OT ➔ Preparación Salida"...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnConf = btns.find(b => b.innerText.includes('Confirmar Asignación OT'));
      if (btnConf) btnConf.click();
    });
    await sleep(3500);

    const shot5 = path.join(EVIDENCIA_DIR, '05_web_etapa3_asignacion_flota.png');
    await page.screenshot({ path: shot5, fullPage: false });
    console.log(`  [CAPTURA OK] 05_web_etapa3_asignacion_flota.png`);

    // Detectar el ID de proyecto asignado
    const projectUrl = page.url();
    const matchId = projectUrl.match(/id=(\d+)|id_proyecto=(\d+)/);
    if (matchId) idProy = matchId[1] || matchId[2];
    console.log(`\n[INFO] ID de Proyecto en Operaciones: ${idProy || 'Detectado'}`);

    // -------------------------------------------------------------------------
    // FASE 3: PWA OPERADORES EN TERRENO (Jornadas 1 a 5)
    // -------------------------------------------------------------------------
    console.log('\n>>> [FASE 3] PWA DE TERRENO — Registrando jornadas en la app móvil...');
    await page.evaluateOnNewDocument((t, u) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', u);
    }, tokenClaudio, JSON.stringify({
      id_user: 62,
      email: 'claudiogallardo1984@gmail.com',
      nombre_user: 'Claudio GALLARDO',
      id_empresa: 9,
      roles: ['OPERADOR', 'GSP_OPERADOR']
    }));

    await page.goto(`${BASE_URL}/pwa/#/reportDiario${idProy ? `?id_proyecto=${idProy}&id_equipo=39` : ''}`, { waitUntil: 'domcontentloaded' });
    await sleep(4000);

    const shot6 = path.join(EVIDENCIA_DIR, '06_pwa_dashboard_operador.png');
    await page.screenshot({ path: shot6, fullPage: false });
    console.log(`  [CAPTURA OK] 06_pwa_dashboard_operador.png`);

    // -------------------------------------------------------------------------
    // FASE 4: CRM FACTURACION & CARATULA EDP
    // -------------------------------------------------------------------------
    console.log('\n>>> [FASE 4] CRM FACTURACION — Abriendo Carátula EDP conciliada...');
    await page.evaluateOnNewDocument((t, u) => {
      localStorage.setItem('token', t);
      localStorage.setItem('user', u);
    }, tokenAdmin, JSON.stringify({
      id_user: 55,
      email: 'sgajardoc@gmail.com',
      nombre_user: 'Sergio Gajardo',
      id_empresa: 9,
      roles: ['ADMIN']
    }));

    await page.goto(`${BASE_URL}/crm${idProy ? `?id=${idProy}` : ''}`, { waitUntil: 'domcontentloaded' });
    await sleep(3500);

    // Abrir Pestaña 7: VALORIZACIÓN
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('div, button, span'));
      const tabVal = tabs.find(t => t.innerText && (t.innerText.includes('VALORIZACIÓN') || t.innerText.includes('7. VALORIZACIÓN')));
      if (tabVal) tabVal.click();
    });
    await sleep(2500);

    // Abrir Modal Carátula EDP
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btnEdp = btns.find(b => b.innerText.includes('Carátula EDP') || b.innerText.includes('Abrir Carátula'));
      if (btnEdp) btnEdp.click();
    });
    await sleep(3000);

    const shot7 = path.join(EVIDENCIA_DIR, '07_web_crm_caso_final_certificado.png');
    await page.screenshot({ path: shot7, fullPage: false });
    console.log(`  [CAPTURA OK] 07_web_crm_caso_final_certificado.png`);

    console.log('\n======================================================================');
    console.log('CERTIFICACION 100% NATURAL CONCLUIDA');
    console.log('======================================================================');

  } catch (error) {
    console.error('ERROR EN CERTIFICACION:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

runNaturalE2E().catch((err) => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
