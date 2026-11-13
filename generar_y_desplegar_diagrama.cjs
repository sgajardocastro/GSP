const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { execFile } = require('child_process');
const { NodeSSH } = require('D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/ejecucion/backend_remoto/node_modules/node-ssh');

const mermaidCode = `flowchart TD
    subgraph F1["1. TERRENO (PWA MÓVIL)"]
        A1["Operador inicia servicio en PWA"] --> A2{"Régimen Operacional<br/>(Distancia a Base)"}
        A2 -- "Urbano (≤ 30 km)" --> A2_U["Cómputo Base a Base:<br/>Horas y horómetro desde salida de base.<br/>Flete según cotización comercial"]
        A2 -- "Rural (> 30 km)" --> A2_R["Cómputo Portón a Portón:<br/>Horas solo en faena.<br/>Flete de traslado según cotización"]
        A2_U --> A3["Ejecución de Maniobras"]
        A2_R --> A3
        A3 --> A3_End["Término de faena + Horómetro final"]
        A3_End --> A4{"¿Falta firma de supervisor<br/>o foto de horómetro?"}
        A4 -- "Sí" --> A5["CANDADO DURO (403):<br/>Bloqueo de nuevos reportes"]
        A4 -- "No" --> A6["Reporte emitido con éxito"]
    end

    subgraph F2["2. TORRE DE CONTROL Y VALIDACIÓN PMO"]
        B1["Monitoreo matutino de reportes"] --> B2{"¿Reportes del día anterior<br/>pendientes a las 13:00 hrs?"}
        B2 -- "Sí" --> B3["Alerta automática WhatsApp + Correo<br/>a Yiara Mendoza y Jorge Ponce"]
        B2 -- "No" --> B4["Analista PMO concilia horas<br/>pactadas vs ejecutadas"]
        B4 --> B5["Estado: VALIDADO ANALISTA"]
    end

    subgraph F3["3. LIQUIDACIÓN TÉCNICA (ITS)"]
        C1["Consolidación incremental de jornales"] --> C2["Imputación de costos reales<br/>(Combustible, peajes, viáticos)"]
        C2 --> C3["Cálculo automático de margen bruto<br/>y anexo con firmas y GPS"]
        C3 --> C4["Paso 1 FES: Analista PMO firma con PIN"]
        C4 --> C5["Paso 2 FES: Jorge Ponce<br/>otorga V°B° técnico con PIN"]
        C5 --> C6["ITS aprobado para Contabilidad"]
    end

    subgraph F4["4. GOBERNANZA EDP Y TESORERÍA"]
        D1["Emisión de Carátula Oficial EDP"] --> D2{"¿Intento de modificar tarifas<br/>o aplicar descuentos?"}
        D2 -- "Operador / Técnico" --> D3["Acceso Denegado (403):<br/>Seguridad por rol"]
        D2 -- "Pamela / Tesorería" --> D4["Modificación de tarifas y descuentos<br/>autorizada formalmente"]
        D4 --> D5["Firma Comercial FES de Tesorería"]
        D5 --> D6{"Condición comercial<br/>del cliente"}
        D6 -- "Pago Previo / Contado" --> D7["Expediente Interno<br/>(No se envía cobro al cliente)"]
        D6 -- "Venta a Crédito" --> D8["Despacho formal al cliente<br/>con copia a GG, Contab y Operaciones"]
    end

    subgraph F5["5. FACTURACIÓN Y CIERRE SII"]
        E1{"¿Cliente cuenta con OC formal?"}
        E1 -- "Con OC" --> E2["Registro Folio OC + Archivo"]
        E1 -- "Sin OC" --> E3["Opción: Cliente Sin OC<br/>(Asume valor devengado en EDP)"]
        E2 --> E4["Emisión DTE en Laudus ERP"]
        E3 --> E4
        E4 --> E5["OT en ESTADO 7: FACTURADO CONFORME"]
    end

    A6 --> B1
    B5 --> C1
    C6 --> D1
    D7 --> E1
    D8 --> E1`;

async function fetchDiagram() {
  const json = JSON.stringify({
    code: mermaidCode,
    mermaid: {
      theme: 'default'
    }
  });

  const deflated = zlib.deflateSync(json);
  const b64 = deflated.toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

  console.log('Descargando imagen SVG del diagrama...');
  const resSvg = await fetch(`https://mermaid.ink/svg/pako:${b64}`);
  if (!resSvg.ok) throw new Error(`SVG fetch failed: ${resSvg.status}`);
  const svgText = await resSvg.text();

  console.log('Descargando imagen PNG del diagrama...');
  const resImg = await fetch(`https://mermaid.ink/img/pako:${b64}`);
  let imgBuf = null;
  if (resImg.ok) {
    const arrayBuf = await resImg.arrayBuffer();
    imgBuf = Buffer.from(arrayBuf);
  }

  return { svgText, imgBuf };
}

async function main() {
  try {
    const { svgText, imgBuf } = await fetchDiagram();
    console.log('Imágenes descargadas exitosamente. SVG:', svgText.length, 'bytes');

    const gestionDir = 'D:/SGajardo/Google Drive/Antigravity/Grúas San Pablo/Propuesta Gestión Operación Grúas/Gestión';
    const svgPath = path.join(gestionDir, 'diagrama_flujo_financiero_gsp.svg');
    const pngPath = path.join(gestionDir, 'diagrama_flujo_financiero_gsp.png');
    const htmlPath = path.join(gestionDir, 'proceso_financiero_integral_y_protocolo_pruebas_gsp.html');
    const pdfPath = path.join(gestionDir, 'proceso_financiero_integral_y_protocolo_pruebas_gsp.pdf');

    fs.writeFileSync(svgPath, svgText, 'utf-8');
    if (imgBuf) fs.writeFileSync(pngPath, imgBuf);
    console.log('Archivos de imagen guardados en Gestión/');

    // Inyectar el diagrama en el HTML
    let html = fs.readFileSync(htmlPath, 'utf-8');

    const diagramHtmlBlock = `
      <!-- Diagrama de Flujo Visual Integral -->
      <div style="background: #ffffff; border: 1px solid var(--slate-200); border-radius: 12px; padding: 24px; margin: 28px 0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); text-align: center;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid var(--slate-100); padding-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 1.4rem;">🗺️</span>
            <div style="text-align: left;">
              <div style="font-weight: 700; color: var(--navy-900); font-size: 1.05rem;">Mapa de Navegación del Circuito Completo (Fase 1 a Fase 5)</div>
              <div style="font-size: 0.8rem; color: var(--slate-500);">Secuencia lógica operacional, validaciones técnicas, filtros SLA y candados duros</div>
            </div>
          </div>
          <span style="font-size: 0.75rem; background: var(--blue-50); color: var(--blue-700); font-weight: 600; padding: 4px 12px; border-radius: 9999px; border: 1px solid var(--blue-200);">Diagrama Oficial</span>
        </div>
        <div style="width: 100%; overflow-x: auto; display: flex; justify-content: center; padding: 10px 0;">
          <img src="diagrama_flujo_financiero_gsp.svg" alt="Diagrama de Flujo Integral" style="max-width: 100%; width: 920px; height: auto; display: block; margin: 0 auto;" />
        </div>
      </div>
    `;

    // Si ya contenía un bloque anterior, reemplazarlo; si no, insertarlo después del pipeline
    if (html.includes('<!-- Diagrama de Flujo Visual Integral -->')) {
      const startIdx = html.indexOf('<!-- Diagrama de Flujo Visual Integral -->');
      const endMarker = '<!-- Sección 2:';
      const endIdx = html.indexOf(endMarker, startIdx);
      if (startIdx !== -1 && endIdx !== -1) {
        html = html.slice(0, startIdx) + diagramHtmlBlock + '\n\n    ' + html.slice(endIdx);
      }
    } else {
      const targetAnchor = '<!-- Sección 2: Descripción Funcional por Fases -->';
      if (html.includes(targetAnchor)) {
        html = html.replace(targetAnchor, diagramHtmlBlock + '\n\n    ' + targetAnchor);
      } else {
        html = html.replace('<!-- Sección 2:', diagramHtmlBlock + '\n\n    <!-- Sección 2:');
      }
    }

    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log('HTML actualizado con el bloque de imagen.');

    // Compilar PDF con Edge headless
    console.log('Compilando PDF con Edge headless...');
    const edge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    await new Promise((res, rej) => {
      execFile(edge, [
        '--headless',
        '--disable-gpu',
        '--no-pdf-header-footer',
        `--print-to-pdf=${pdfPath}`,
        `file:///${htmlPath.replace(/\\/g, '/')}`
      ], (err) => {
        if (err) return rej(err);
        res();
      });
    });
    const pdfStats = fs.statSync(pdfPath);
    console.log('PDF compilado OK. Tamaño:', (pdfStats.size / 1024).toFixed(1), 'KB');

    // Desplegar al servidor Linux
    console.log('Conectando vía SSH a servidor.leanglobal.cl:1295...');
    const ssh = new NodeSSH();
    await ssh.connect({
      host: 'servidor.leanglobal.cl',
      username: 'root',
      password: 'lgbl2025.',
      port: 1295,
      readyTimeout: 15000
    });
    console.log('Conexión SSH exitosa.');

    const remoteDir = '/var/www/html/pptas/GSP/reuniones';
    await ssh.execCommand(`mkdir -p ${remoteDir}`);

    console.log('Transfiriendo archivos a', remoteDir, '...');
    await ssh.putFile(htmlPath, `${remoteDir}/proceso_financiero_integral_y_protocolo_pruebas_gsp.html`);
    console.log('-> HTML transferido');

    await ssh.putFile(svgPath, `${remoteDir}/diagrama_flujo_financiero_gsp.svg`);
    console.log('-> SVG transferido');

    if (fs.existsSync(pngPath)) {
      await ssh.putFile(pngPath, `${remoteDir}/diagrama_flujo_financiero_gsp.png`);
      console.log('-> PNG transferido');
    }

    await ssh.putFile(pdfPath, `${remoteDir}/proceso_financiero_integral_y_protocolo_pruebas_gsp.pdf`);
    console.log('-> PDF transferido');

    await ssh.execCommand(`chmod 644 ${remoteDir}/*.*`);
    console.log('Permisos 644 aplicados.');

    const checkRes = await ssh.execCommand(`ls -lh ${remoteDir}`);
    console.log('=== LISTADO REMOTO EN SERVIDOR LINUX ===');
    console.log(checkRes.stdout);

    ssh.dispose();
    console.log('¡DESPLIEGUE FINALIZADO EXITOSAMENTE!');
  } catch (err) {
    console.error('ERROR EN EL PROCESO:', err);
    process.exit(1);
  }
}

main();
