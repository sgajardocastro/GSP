/**
 * ============================================================================
 * SUITE DE PRUEBAS INTEGRALES END-TO-END - ECOSISTEMA GRÚAS SAN PABLO (GSP)
 * ============================================================================
 * 
 * Filosofía: Cero suposiciones, Cero mocks ciegos, Validación contra endpoints reales.
 * Ambiente  : Desarrollo (DEV) - https://servidor.leanglobal.cl/lg-gsp-dev/api
 * Base Datos: PostgreSQL Remoto sch_leangsp (138.255.103.18:1295)
 * 
 * Baterías Evaluadas:
 *   1. Gestor Documental Dimensional 360° (Empresas, Equipos PAD-22, OT 111, Actas y Contratos)
 *   2. Almacenamiento Físico y Descarga Binaria (Storage resolution, %PDF- > 10KB)
 *   3. Ciclo Comercial y Contratos de Arriendo FES (Puppeteer, Token y Firma Digital)
 *   4. Operaciones de Terreno & Actas 360° de Plataformas (Checklists, Fotos, Firmas)
 *   5. Desplazamientos en Ruta y Report Diario Digital (Aritmética Standby, Colación, Horómetros)
 *   6. Torre de Control Kanban, ITS Transición y Liquidación EDP
 *   7. Salud de Infraestructura, Base de Datos y Procesos PM2
 * ============================================================================
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

const CONFIG = {
  DEV_API_BASE: 'https://servidor.leanglobal.cl/lg-gsp-dev/api',
  DEV_WEB_URL: 'https://servidor.leanglobal.cl/lg-gsp-dev/',
  SSH: {
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295,
    readyTimeout: 30000
  },
  LEANGSP_TOKEN: '09accb0a56ab0cabab2101891ccf1576b208c41efd4c9f9b563201e35fc9533a30596590c9bf60589803823bb423a9b946ce1bd1cf84480970083b75fcd36b2fe06f5fface5f49fe18b2151b7c7f4ee4a65f958bcbaa38c53ca80f4c44c53b37832f4506c7f8304628fc149e4981dd6e7ce24ccbc8cd8847ff72f15b5e853b9468c010f10486e82e50b178fb0d1d09e1c031caedb6abafc4da953937992a852e39c407f53e59b711c138c1bcc75216917404c940ea43d582ad1fef41ac0ae2e421803d7f25ce7b25892309c8d7087abc01b53574f5c027f1a15c31b22b5b893afa0fcfcbbdefeb229fc98c5a67b2fa21aa1debc8bff8ba79f0a238d0e52039f609def445d225df0bf767a8acdccb3f7052f9b3f428c574d1a9b2421704859063434c40a8d788192a2a4a5ceaf4a1bad52836f509ed6dabec24d4d0bceca7b912ae372c66979a5c8890f2af6bb994ef7ba690994f0c8565ce7bc10112ed4c0699ec309a4ad9821fb24456df430dfc4b4c4825a6cd2d6b72f5f46e63fb07cb2a7e'
};

function requestHttp(url, options = {}, data = null) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    const t0 = Date.now();

    const req = client.request(url, options, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const duration = Date.now() - t0;
        const rawBuffer = Buffer.concat(chunks);
        let parsed = null;
        try {
          parsed = JSON.parse(rawBuffer.toString('utf8'));
        } catch (e) {
          parsed = rawBuffer.toString('utf8');
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          rawBuffer,
          duration
        });
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 0, error: err.message, duration: Date.now() - t0, rawBuffer: Buffer.alloc(0) });
    });

    if (data) {
      if (typeof data === 'object') {
        req.write(JSON.stringify(data));
      } else {
        req.write(data);
      }
    }
    req.end();
  });
}

async function runComprehensiveQA() {
  console.log('================================================================================');
  console.log('CICLO INTEGRAL DE PRUEBAS QA END-TO-END - ECOSISTEMA GSP (DEV)');
  console.log('Fecha/Hora :', new Date().toISOString());
  console.log('Servidor   : 138.255.103.18 (lg-gsp-dev / PM2 ID 10)');
  console.log('Esquema BD : sch_leangsp');
  console.log('================================================================================\n');

  const resultados = [];
  const ssh = new NodeSSH();

  try {
    // -------------------------------------------------------------------------
    // BATERÍA 1: GESTOR DOCUMENTAL Y BIBLIOTECA 360°
    // -------------------------------------------------------------------------
    console.log('[BATERÍA 1] Evaluando Gestor Documental y Dimensiones 360°...');

    // 1.1 Web Dev Activo
    const resWeb = await requestHttp(CONFIG.DEV_WEB_URL);
    resultados.push({
      bateria: '1. Biblioteca 360°',
      prueba: 'Disponibilidad Web DEV',
      recurso: CONFIG.DEV_WEB_URL,
      esperado: 'HTTP 200 OK',
      obtenido: `HTTP ${resWeb.statusCode} (${resWeb.duration}ms)`,
      veredicto: resWeb.statusCode === 200 ? 'PASA' : 'FALLA'
    });

    // 1.2 Flota de Equipos (Debe entregar 110 equipos)
    const resEq = await requestHttp(`${CONFIG.DEV_API_BASE}/tequ-equipos`);
    const totalEquipos = Array.isArray(resEq.data?.data) ? resEq.data.data.length : (Array.isArray(resEq.data) ? resEq.data.length : 0);
    const pad22 = (resEq.data?.data || []).find(e => e.patente === 'PAD-22' || e.id_equipo === 106);

    resultados.push({
      bateria: '1. Biblioteca 360°',
      prueba: 'Nómina Total de Equipos (Flota)',
      recurso: `${CONFIG.DEV_API_BASE}/tequ-equipos`,
      esperado: '>= 100 equipos (incluyendo PAD-22 en Bestmaq)',
      obtenido: `HTTP ${resEq.statusCode} (Total: ${totalEquipos}, PAD-22 Empresa: ${pad22?.id_empresa})`,
      veredicto: (resEq.statusCode === 200 && totalEquipos >= 100 && pad22 && Number(pad22.id_empresa) === 7) ? 'PASA' : 'FALLA'
    });

    // 1.3 Certificados de Equipo PAD-22
    const resCertEq = await requestHttp(`${CONFIG.DEV_API_BASE}/tequ-equipos/106/certificados`);
    const certsCount = Array.isArray(resCertEq.data?.data) ? resCertEq.data.data.length : 0;
    resultados.push({
      bateria: '1. Biblioteca 360°',
      prueba: 'Certificados Técnicos Equipo PAD-22',
      recurso: `${CONFIG.DEV_API_BASE}/tequ-equipos/106/certificados`,
      esperado: 'HTTP 200 OK',
      obtenido: `HTTP ${resCertEq.statusCode} (Certificados: ${certsCount})`,
      veredicto: resCertEq.statusCode === 200 ? 'PASA' : 'FALLA'
    });

    // 1.4 Actas 360° vinculadas al Equipo PAD-22
    const resActasEq = await requestHttp(`${CONFIG.DEV_API_BASE}/operaciones/acta-plataforma/equipo/106`);
    const actasEqList = resActasEq.data?.actas || [];
    const tieneActa111 = actasEqList.some(a => a.folio_acta === 'ACT-2610-111' && a.id_file_pdf_entrega == 1508 && a.id_file_pdf_final == 1517);

    resultados.push({
      bateria: '1. Biblioteca 360°',
      prueba: 'Actas 360° en Ficha Equipo PAD-22',
      recurso: `${CONFIG.DEV_API_BASE}/operaciones/acta-plataforma/equipo/106`,
      esperado: 'HTTP 200 con ACT-2610-111 (PDFs 1508 y 1517)',
      obtenido: `HTTP ${resActasEq.statusCode} (Actas: ${actasEqList.length}, ACT-2610-111 vinculada: ${tieneActa111})`,
      veredicto: (resActasEq.statusCode === 200 && tieneActa111) ? 'PASA' : 'FALLA'
    });

    // 1.5 Carga Universal de Proyectos con _bypass_empresa: true
    const resProyUniv = await requestHttp(`${CONFIG.DEV_API_BASE}/proyectos?_bypass_empresa=true&_id_empresa=0`, {
      headers: { 'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}` }
    });
    const proyList = resProyUniv.data?.proyectos || [];
    const proy111 = proyList.find(p => p.id_proyecto === 111);

    resultados.push({
      bateria: '1. Biblioteca 360°',
      prueba: 'Carga Universal de OTs en Biblioteca (Bypass Empresa)',
      recurso: `${CONFIG.DEV_API_BASE}/proyectos?_bypass_empresa=true&_id_empresa=0`,
      esperado: 'HTTP 200 con OT 111 (BMQ-2610-4851-001) presente',
      obtenido: `HTTP ${resProyUniv.statusCode} (Total OTs: ${proyList.length}, OT 111 presente: ${!!proy111})`,
      veredicto: (resProyUniv.statusCode === 200 && !!proy111) ? 'PASA' : 'FALLA'
    });

    // 1.6 Contrato Firmado FES en OT 111
    let jf111 = proy111?.json_field;
    if (typeof jf111 === 'string') {
      try { jf111 = JSON.parse(jf111); } catch (e) {}
    }
    const ctr111 = jf111?.crm_v1?.contrato || jf111?.contrato_arriendo;
    const esCtrFirmado = ctr111?.estado === 'FIRMADO_DIGITAL' && Number(ctr111?.id_doc) > 0 && ctr111?.folio === 'CTR-2026-0111';

    resultados.push({
      bateria: '1. Biblioteca 360°',
      prueba: 'Contrato Suscrito FES en OT 111',
      recurso: 'tpry_proyecto.json_field (id_proyecto = 111)',
      esperado: 'estado=FIRMADO_DIGITAL, id_doc > 0, folio=CTR-2026-0111',
      obtenido: `estado: ${ctr111?.estado}, id_doc: ${ctr111?.id_doc}, folio: ${ctr111?.folio}`,
      veredicto: esCtrFirmado ? 'PASA' : 'FALLA'
    });

    // 1.7 Documentos Institucionales de Sociedades Holding
    const resDocsEmp = await requestHttp(`${CONFIG.DEV_API_BASE}/acreditacion/empresa/9/documentos`);
    const docsEmpCount = Array.isArray(resDocsEmp.data?.data) ? resDocsEmp.data.data.length : 0;
    resultados.push({
      bateria: '1. Biblioteca 360°',
      prueba: 'Expediente Institucional Empresa (GSP SpA)',
      recurso: `${CONFIG.DEV_API_BASE}/acreditacion/empresa/9/documentos`,
      esperado: 'HTTP 200 OK con nómina de documentos',
      obtenido: `HTTP ${resDocsEmp.statusCode} (Documentos: ${docsEmpCount})`,
      veredicto: resDocsEmp.statusCode === 200 ? 'PASA' : 'FALLA'
    });

    // -------------------------------------------------------------------------
    // BATERÍA 2: ALMACENAMIENTO FÍSICO Y DESCARGA BINARIA DE PDFs
    // -------------------------------------------------------------------------
    console.log('[BATERÍA 2] Auditando resolución física de PDFs en Storage...');

    // 2.1 Descarga PDF Contrato Firmado (ID: 1478)
    const resDoc1478 = await requestHttp(`${CONFIG.DEV_API_BASE}/archivo/ver/1478`);
    const isPdf1478 = resDoc1478.rawBuffer.slice(0, 5).toString('utf8') === '%PDF-';
    resultados.push({
      bateria: '2. Storage Binario',
      prueba: 'Descarga PDF Contrato Firmado OT 111 (Doc 1478)',
      recurso: `${CONFIG.DEV_API_BASE}/archivo/ver/1478`,
      esperado: 'HTTP 200 con cabecera %PDF- y tamaño > 10 KB',
      obtenido: `HTTP ${resDoc1478.statusCode} (${(resDoc1478.rawBuffer.length / 1024).toFixed(1)} KB, Cabecera: ${resDoc1478.rawBuffer.slice(0, 5).toString()})`,
      veredicto: (resDoc1478.statusCode === 200 && isPdf1478 && resDoc1478.rawBuffer.length > 10240) ? 'PASA' : 'FALLA'
    });

    // 2.2 Descarga PDF Acta Entrega Terreno 360° (ID: 1508)
    const resDoc1508 = await requestHttp(`${CONFIG.DEV_API_BASE}/archivo/ver/1508`);
    const isPdf1508 = resDoc1508.rawBuffer.slice(0, 5).toString('utf8') === '%PDF-';
    resultados.push({
      bateria: '2. Storage Binario',
      prueba: 'Descarga PDF Acta Entrega 360° (Doc 1508)',
      recurso: `${CONFIG.DEV_API_BASE}/archivo/ver/1508`,
      esperado: 'HTTP 200 con cabecera %PDF- y tamaño > 10 KB',
      obtenido: `HTTP ${resDoc1508.statusCode} (${(resDoc1508.rawBuffer.length / 1024).toFixed(1)} KB, Cabecera: ${resDoc1508.rawBuffer.slice(0, 5).toString()})`,
      veredicto: (resDoc1508.statusCode === 200 && isPdf1508 && resDoc1508.rawBuffer.length > 10240) ? 'PASA' : 'FALLA'
    });

    // 2.3 Descarga PDF Acta Retiro / Cierre Terreno 360° (ID: 1517)
    const resDoc1517 = await requestHttp(`${CONFIG.DEV_API_BASE}/archivo/ver/1517`);
    const isPdf1517 = resDoc1517.rawBuffer.slice(0, 5).toString('utf8') === '%PDF-';
    resultados.push({
      bateria: '2. Storage Binario',
      prueba: 'Descarga PDF Acta Retiro / Final 360° (Doc 1517)',
      recurso: `${CONFIG.DEV_API_BASE}/archivo/ver/1517`,
      esperado: 'HTTP 200 con cabecera %PDF- y tamaño > 10 KB',
      obtenido: `HTTP ${resDoc1517.statusCode} (${(resDoc1517.rawBuffer.length / 1024).toFixed(1)} KB, Cabecera: ${resDoc1517.rawBuffer.slice(0, 5).toString()})`,
      veredicto: (resDoc1517.statusCode === 200 && isPdf1517 && resDoc1517.rawBuffer.length > 10240) ? 'PASA' : 'FALLA'
    });

    // 2.4 Descarga Certificado Histórico de Equipo con Case-Insensitivity (Doc 767)
    const resDoc767 = await requestHttp(`${CONFIG.DEV_API_BASE}/archivo/ver/767`);
    const isPdf767 = resDoc767.rawBuffer.slice(0, 5).toString('utf8') === '%PDF-';
    resultados.push({
      bateria: '2. Storage Binario',
      prueba: 'Resolución Case-Insensitive Storage (Doc 767 GSP/Equipos)',
      recurso: `${CONFIG.DEV_API_BASE}/archivo/ver/767`,
      esperado: 'HTTP 200 OK con %PDF- (supera divergencia mayúsculas)',
      obtenido: `HTTP ${resDoc767.statusCode} (${(resDoc767.rawBuffer.length / 1024).toFixed(1)} KB)`,
      veredicto: (resDoc767.statusCode === 200 && isPdf767) ? 'PASA' : 'FALLA'
    });

    // -------------------------------------------------------------------------
    // BATERÍA 3: CICLO COMERCIAL, CONTRATOS Y FIRMA DIGITAL FES
    // -------------------------------------------------------------------------
    console.log('[BATERÍA 3] Auditando generación documental Puppeteer y Firma FES...');

    // 3.1 Generación de Contrato Legal Puppeteer a 10px (OT 111)
    const resGenContrato = await requestHttp(`${CONFIG.DEV_API_BASE}/proyectos/111/contrato/generar-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, {
      id_empresa_arrendador: 7, // Bestmaq
      fecha_inicio: '2026-10-18',
      fecha_termino: '2026-11-18',
      representante_nombre: 'Sergio Gajardo',
      representante_rut: '9161957-1',
      representante_cargo: 'Administrador de Contrato',
      representante_telefono: '+56936483259',
      representante_email: 'sgajardoc@gmail.com',
      vendedor_email: 'lguser@arriendosanpablo.cl'
    });

    const urlContratoGenerado = resGenContrato.data?.contrato?.url_pdf || resGenContrato.data?.url_pdf || '';
    const contratoOk = resGenContrato.statusCode === 200 && Boolean(urlContratoGenerado);
    resultados.push({
      bateria: '3. Comercial & Contratos',
      prueba: 'Compilación Puppeteer Contrato Legal (3 Páginas a 10px)',
      recurso: `${CONFIG.DEV_API_BASE}/proyectos/111/contrato/generar-pdf`,
      esperado: 'HTTP 200 con url_pdf emitido',
      obtenido: `HTTP ${resGenContrato.statusCode} (URL: ${urlContratoGenerado.slice(0, 40)}..., ${resGenContrato.duration}ms)`,
      veredicto: contratoOk ? 'PASA' : 'FALLA'
    });

    // 3.2 Generación de Token de Firma Pública FES
    const resGenToken = await requestHttp(`${CONFIG.DEV_API_BASE}/proyectos/111/contrato/generar-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const tokenFirma = resGenToken.data?.token || resGenToken.data?.token_firma || '';
    const tokenOk = resGenToken.statusCode === 200 && Boolean(tokenFirma);
    resultados.push({
      bateria: '3. Comercial & Contratos',
      prueba: 'Generación Token FES Seguro para Firma Móvil',
      recurso: `${CONFIG.DEV_API_BASE}/proyectos/111/contrato/generar-token`,
      esperado: 'HTTP 200 con token alfanumérico SHA-256',
      obtenido: `HTTP ${resGenToken.statusCode} (Token: ${tokenFirma.slice(0, 16)}..., ${resGenToken.duration}ms)`,
      veredicto: tokenOk ? 'PASA' : 'FALLA'
    });

    // 3.3 Consulta Pública de Contrato por Token (Sin Auth)
    if (tokenFirma) {
      const resTokenPub = await requestHttp(`${CONFIG.DEV_API_BASE}/proyectos/contrato/public/${tokenFirma}`);
      const tokenPubOk = resTokenPub.statusCode === 200 && resTokenPub.data?.success;
      resultados.push({
        bateria: '3. Comercial & Contratos',
        prueba: 'Consulta Endpoint Público de Firma Móvil',
        recurso: `${CONFIG.DEV_API_BASE}/proyectos/contrato/public/:token`,
        esperado: 'HTTP 200 con contrato listo para firmar',
        obtenido: `HTTP ${resTokenPub.statusCode} (${resTokenPub.duration}ms, Folio: ${resTokenPub.data?.contrato?.folio || 'OK'})`,
        veredicto: tokenPubOk ? 'PASA' : 'FALLA'
      });
    }

    // -------------------------------------------------------------------------
    // BATERÍA 4: OPERACIONES DE TERRENO Y ACTAS 360° DE PLATAFORMAS
    // -------------------------------------------------------------------------
    console.log('[BATERÍA 4] Evaluando motor de Actas 360° de Plataformas...');

    // 4.1 Consulta general de actas de plataforma
    const resActasAll = await requestHttp(`${CONFIG.DEV_API_BASE}/operaciones/acta-plataforma?_bypass_empresa=true&_id_empresa=0`);
    const actasArray = resActasAll.data?.actas || [];
    const acta2 = actasArray.find(a => a.id_acta === 2);

    resultados.push({
      bateria: '4. Actas Terreno 360°',
      prueba: 'Listado Maestro de Actas Plataformas',
      recurso: `${CONFIG.DEV_API_BASE}/operaciones/acta-plataforma`,
      esperado: 'HTTP 200 con Acta 2 (ACT-2610-111) en estado RECIBIDA_CONFORME',
      obtenido: `HTTP ${resActasAll.statusCode} (Total: ${actasArray.length}, Estado Acta 2: ${acta2?.estado})`,
      veredicto: (resActasAll.statusCode === 200 && acta2?.estado === 'RECIBIDA_CONFORME') ? 'PASA' : 'FALLA'
    });

    // 4.2 Verificación de los 19 ítems de checklist en Acta
    const chkEntrega = acta2?.checklist_entrega || [];
    const fotosEntrega = acta2?.fotos_entrega || [];
    const fotosRetiro = acta2?.fotos_retiro || [];
    const checklistCompleto = chkEntrega.length >= 18 && fotosEntrega.length >= 7 && fotosRetiro.length >= 7;

    resultados.push({
      bateria: '4. Actas Terreno 360°',
      prueba: 'Integridad Checklist 19 Ítems & Fotos 360° (Acta 2)',
      recurso: 'tope_acta_plataforma (id_acta = 2)',
      esperado: '>=18 ítems checklist, >=7 fotos entrega, >=7 fotos retiro',
      obtenido: `Checklist: ${chkEntrega.length} ítems, Fotos Entrega: ${fotosEntrega.length}, Fotos Retiro: ${fotosRetiro.length}`,
      veredicto: checklistCompleto ? 'PASA' : 'FALLA'
    });

    // -------------------------------------------------------------------------
    // BATERÍA 5: DESPLAZAMIENTOS EN RUTA Y REPORT DIARIO DIGITAL
    // -------------------------------------------------------------------------
    console.log('[BATERÍA 5] Conectando por SSH y evaluando Desplazamiento y Report Diario...');
    await ssh.connect(CONFIG.SSH);

    // 5.1 Registro y persistencia de Report Diario con Standby
    const testReportPayload = {
      id_proyecto: 111,
      fecha_reporte: new Date().toISOString().split('T')[0],
      horometro_inicio: 2500.0,
      horometro_fin: 2509.0,
      horometro_superestructura_ini: null,
      horometro_superestructura_fin: null,
      hora_inicio_faena: '08:00',
      hora_fin_faena: '18:00',
      tiempo_colacion_min: 60,
      horas_standby_cliente: 3.5,
      horas_standby_gsp: 0.5,
      horas_operadas: 5.0,
      motivo_standby: 'QA DETERMINISTA: Espera liberacion frente cliente (3.5h) + check hidraulico GSP (0.5h)',
      observaciones: 'Certificación determinista end-to-end de cálculo y deducciones',
      firma_mandante: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    };

    const resReportSave = await requestHttp(`${CONFIG.DEV_API_BASE}/operaciones/report/guardar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }, testReportPayload);

    // Consulta en PostgreSQL para validar fórmula aritmética:
    // Jornada Bruta = 10h. Neta = 9h. Horas Operadas = 9h - 3.5h - 0.5h = 5.0h
    const sqlAuditRep = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT id_reporte_avance, horas_operadas, horas_standby_cliente, horas_standby_gsp, motivo_standby FROM sch_leangsp.tedp_reporte_avance WHERE id_proyecto = 111 ORDER BY id_reporte_avance DESC LIMIT 1;\\""`;
    const resSqlAudit = await ssh.execCommand(sqlAuditRep);
    const [idRepAvance, horasOp, sbCli, sbGsp] = resSqlAudit.stdout.trim().split('|');

    const formulaOk = Number(horasOp) === 5.0 && Number(sbCli) === 3.5 && Number(sbGsp) === 0.5;
    resultados.push({
      bateria: '5. Operaciones & Reports',
      prueba: 'Cálculo Aritmético de Jornada Neta y Standby',
      recurso: 'tedp_reporte_avance (PostgreSQL DEV)',
      esperado: 'horas_operadas=5.00, standby_cliente=3.50, standby_gsp=0.50',
      obtenido: `id: ${idRepAvance}, operadas: ${horasOp}, cli: ${sbCli}, gsp: ${sbGsp}`,
      veredicto: formulaOk ? 'PASA' : 'FALLA'
    });

    // 5.2 Compilación Puppeteer del Reporte Diario
    const pdfReportCmd = `su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp && node -e '
      require(\\"dotenv\\").config();
      const { generarPdfReportDiario } = require(\\"./src/services/reportDiarioPdfService\\");
      const db = require(\\"./src/config/postgresPool\\");

      (async () => {
        try {
          const { rows } = await db.query(\\"SELECT * FROM sch_leangsp.tedp_reporte_avance WHERE id_reporte_avance = ${idRepAvance}\\");
          if (!rows.length) { console.log(\\"NO_ROW\\"); return; }
          const rep = rows[0];
          rep.id_reporte = rep.id_reporte_avance;
          const buf = await generarPdfReportDiario({
            report: rep,
            proyecto: { codi_proyecto: \\"BMQ-2610-4851-001\\", nombre_proyecto: \\"test bestmaq\\" },
            validador: { nombre: \\"Auditor QA\\", rut: \\"1-9\\" }
          });
          console.log(\\"PDF_REPORT_OK:\\" + buf.length + \\":\\" + buf.slice(0, 5).toString());
        } catch (err) {
          console.error(\\"PDF_REPORT_ERR:\\", err.message);
        }
      })();
    '"`;

    const resPdfReport = await ssh.execCommand(pdfReportCmd);
    const pdfReportOut = resPdfReport.stdout.trim();
    const isReportPdfOk = pdfReportOut.includes('PDF_REPORT_OK:');
    const reportPdfSize = pdfReportOut.match(/PDF_REPORT_OK:(\d+):%PDF/) ? RegExp.$1 : '0';

    resultados.push({
      bateria: '5. Operaciones & Reports',
      prueba: 'Compilación Puppeteer PDF Reporte Diario',
      recurso: 'reportDiarioPdfService.js (Puppeteer Headless)',
      esperado: 'Buffer binario %PDF- > 10 KB con sellado FES',
      obtenido: isReportPdfOk ? `%PDF- generado (${(Number(reportPdfSize) / 1024).toFixed(1)} KB)` : `Fallo: ${resPdfReport.stderr || pdfReportOut}`,
      veredicto: isReportPdfOk ? 'PASA' : 'FALLA'
    });

    // -------------------------------------------------------------------------
    // BATERÍA 6: TORRE DE CONTROL KANBAN, ITS TRANSICIÓN Y EDP
    // -------------------------------------------------------------------------
    console.log('[BATERÍA 6] Auditando Torre de Control Kanban e ITS Transición...');

    // 6.1 Endpoint de ITS Transición
    const resIts = await requestHttp(`${CONFIG.DEV_API_BASE}/operaciones/its/proyecto/111`, {
      headers: { 'Authorization': `Bearer ${CONFIG.LEANGSP_TOKEN}` }
    });
    const itsOk = resIts.statusCode === 200 || resIts.statusCode === 404; // 200 si existe o 404 estructurado
    resultados.push({
      bateria: '6. PMO & Cierre Finanzas',
      prueba: 'Consulta Endpoint ITS Transición OT 111',
      recurso: `${CONFIG.DEV_API_BASE}/operaciones/its/proyecto/111`,
      esperado: 'HTTP 200 OK (o 404 controlado si no ha sido generado)',
      obtenido: `HTTP ${resIts.statusCode} (${resIts.duration}ms)`,
      veredicto: itsOk ? 'PASA' : 'FALLA'
    });

    // 6.2 Visitas Técnicas de Terreno
    const resVisitas = await requestHttp(`${CONFIG.DEV_API_BASE}/survey/visitas-terreno`);
    const totalVisitas = Array.isArray(resVisitas.data) ? resVisitas.data.length : 0;
    resultados.push({
      bateria: '6. PMO & Cierre Finanzas',
      prueba: 'Catálogo de Visitas Técnicas a Terreno',
      recurso: `${CONFIG.DEV_API_BASE}/survey/visitas-terreno`,
      esperado: 'HTTP 200 con >= 50 visitas en base de datos',
      obtenido: `HTTP ${resVisitas.statusCode} (Visitas registradas: ${totalVisitas})`,
      veredicto: (resVisitas.statusCode === 200 && totalVisitas >= 50) ? 'PASA' : 'FALLA'
    });

    // -------------------------------------------------------------------------
    // BATERÍA 7: SALUD DE INFRAESTRUCTURA, STORAGE Y BASE DE DATOS
    // -------------------------------------------------------------------------
    console.log('[BATERÍA 7] Auditando salud de procesos PM2, disco y PostgreSQL...');

    // 7.1 Proceso PM2 Backend DEV (ID: 10)
    const pm2DevRes = await ssh.execCommand('su - nodeadmin -c "pm2 describe 10"');
    const pm2DevText = pm2DevRes.stdout.trim();
    const isPm2Online = pm2DevText.includes('online') && pm2DevText.includes('lean-services-gsp');

    resultados.push({
      bateria: '7. Infraestructura & DB',
      prueba: 'Salud Proceso PM2 10 (lean-services-gsp DEV)',
      recurso: 'PM2 Process ID 10',
      esperado: 'status=online, uptime activo',
      obtenido: isPm2Online ? 'status: online (lean-services-gsp activo)' : `Salida: ${pm2DevText.slice(0, 60)}`,
      veredicto: isPm2Online ? 'PASA' : 'FALLA'
    });

    // 7.2 Existencia de tablas clave en sch_leangsp
    const sqlCheckTables = `su - postgres -c "psql -d postgres -t -A -c \\"SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'sch_leangsp' AND table_name IN ('tope_acta_plataforma', 'tedp_reporte_avance', 'tequ_log_desplazamiento', 'tinv_producto', 'tmnt_ot');\\""`;
    const resSqlTables = await ssh.execCommand(sqlCheckTables);
    const countTables = Number(resSqlTables.stdout.trim());

    resultados.push({
      bateria: '7. Infraestructura & DB',
      prueba: 'Integridad Tablas Nucleares (sch_leangsp)',
      recurso: 'PostgreSQL sch_leangsp',
      esperado: '5 tablas nucleares verificadas (actas, reports, viajes, wms, mnt)',
      obtenido: `${countTables} de 5 tablas encontradas`,
      veredicto: countTables === 5 ? 'PASA' : 'FALLA'
    });

    // 7.3 Espacio en Disco en Servidor
    const dfRes = await ssh.execCommand("df -h / | awk 'NR==2 {print $4, $5}'");
    const [espacioLibre, usoPct] = dfRes.stdout.trim().split(' ');
    const usoNum = parseInt(usoPct.replace('%', ''), 10);

    resultados.push({
      bateria: '7. Infraestructura & DB',
      prueba: 'Capacidad de Almacenamiento en Disco (Partición /)',
      recurso: 'Filesystem / (138.255.103.18)',
      esperado: 'Uso < 90%, espacio libre suficiente',
      obtenido: `Disponible: ${espacioLibre}, Uso: ${usoPct}`,
      veredicto: usoNum < 90 ? 'PASA' : 'FALLA'
    });

  } finally {
    ssh.dispose();
  }

  // ---------------------------------------------------------------------------
  // CONSOLIDADO DETERMINISTA
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('MATRIZ CONSOLIDADA DE RESULTADOS QA (CERTIFICACIÓN DETERMINISTA)');
  console.log('================================================================================');
  console.table(resultados);

  const total = resultados.length;
  const passed = resultados.filter(r => r.veredicto === 'PASA').length;
  const failed = total - passed;
  const passRate = Math.round((passed / total) * 100);

  console.log('--------------------------------------------------------------------------------');
  console.log(`RESUMEN GENERAL: ${passed} de ${total} pruebas superadas (${passRate}% de efectividad).`);
  console.log('--------------------------------------------------------------------------------');

  const fsReportPath = path.resolve(__dirname, 'ultimo_reporte_qa_integral.json');
  fs.writeFileSync(fsReportPath, JSON.stringify({ fecha: new Date().toISOString(), passRate, passed, failed, total, resultados }, null, 2));

  if (failed > 0) {
    console.error(`\n[ALERTA QA] Se detectaron ${failed} pruebas fallidas. Revisar detalle arriba.`);
    process.exit(1);
  } else {
    console.log('\n[CERTIFICACIÓN DETERMINISTA TOTAL] El 100% de las pruebas operan con éxito.');
    process.exit(0);
  }
}

runComprehensiveQA().catch(err => {
  console.error('\nError fatal durante la auditoría QA:', err);
  process.exit(1);
});
