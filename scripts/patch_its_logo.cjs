const fs = require('fs');
const path = require('path');
const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

const logoPngPath = path.resolve(__dirname, '../ejecucion/frontend/public/logo-sanpablo.png');
const logoB64 = fs.readFileSync(logoPngPath).toString('base64');
const servicePath = path.resolve(__dirname, '../ejecucion/backend_remoto/src/services/itsPdfService.js');

let code = fs.readFileSync(servicePath, 'utf8');

// Insert LOGO_GSP_BASE64 constant
if (!code.includes('LOGO_GSP_BASE64')) {
  code = code.replace(
    "const { v4: uuidv4 } = require('uuid');",
    `const { v4: uuidv4 } = require('uuid');\n\nconst LOGO_GSP_BASE64 = 'data:image/png;base64,${logoB64}';`
  );
}

// In buildItsHtml, add logo resolution
if (!code.includes('let logoBase64 =')) {
  code = code.replace(
    'const { its, proyecto, jornadas, costos, firmas, validacionUrl } = data;',
    `const { its, proyecto, jornadas, costos, firmas, validacionUrl } = data;\n\n  let logoBase64 = '';\n  try {\n    const candidatePaths = [\n      path.join(__dirname, '../../../frontend/public/logo-sanpablo.png'),\n      path.join(__dirname, '../../../frontend/public/logo_gsp.png'),\n      path.join(process.cwd(), '../frontend/public/logo-sanpablo.png'),\n      path.join(process.cwd(), 'public/logo-sanpablo.png')\n    ];\n    for (const p of candidatePaths) {\n      if (fs.existsSync(p)) {\n        const fileBuf = fs.readFileSync(p);\n        logoBase64 = \`data:image/png;base64,\${fileBuf.toString('base64')}\`;\n        break;\n      }\n    }\n  } catch (e) {}\n  if (!logoBase64) {\n    logoBase64 = LOGO_GSP_BASE64;\n  }`
  );
}

// Replace header HTML
const oldHeaderRegex = /<!-- Header Membretado Oficial -->[\s\S]*?<!-- 1\. DATOS DEL SERVICIO INTEGRAL -->/;
const newHeaderHtml = `<!-- Header Membretado Oficial -->
    <table style="width: 100%; border-bottom: 2.5px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 12px; border-collapse: collapse;">
        <tr>
            <td style="width: 38%; vertical-align: middle;">
                <table style="border-collapse: collapse;">
                    <tr>
                        \${logoBase64 ? \`<td style="vertical-align: middle; padding-right: 12px;"><img src="\${logoBase64}" style="max-height: 48px; max-width: 130px; object-fit: contain; display: block;" alt="San Pablo" /></td>\` : ''}
                        <td style="vertical-align: middle;">
                            <div style="font-size: 15px; font-weight: 900; color: #1e3a8a; letter-spacing: 0.5px; line-height: 1.1;">\${empresaNombreFantasia}</div>
                            <div style="font-size: 8px; font-weight: 800; color: #64748b; letter-spacing: 1px;">ARRIENDO DE MAQUINARIAS</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td style="width: 32%; text-align: center; vertical-align: middle;">
                <h1 style="font-size: 14.5px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
                    INFORME TÉRMINO DE SERVICIO
                </h1>
                <div style="font-size: 10px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin-top: 2px; letter-spacing: 0.5px;">
                    (\${regimen})
                </div>
            </td>
            <td style="width: 30%; text-align: right; vertical-align: middle;">
                <div style="display: inline-block; background-color: #1e1b4b; border: 1.5px solid #312e81; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 900; color: #ffffff; font-family: monospace; letter-spacing: 0.5px;">
                    FOLIO N° \${folio} <span style="color: #93c5fd; font-weight: 800; font-size: 9.5px; margin-left: 3px;">(V\${version})</span>
                </div>
                <div style="margin-top: 2px;">
                    <span style="display: inline-block; background-color: #fef3c7; border: 1.5px solid #f59e0b; padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 900; color: #92400e;">
                        Cotización #\${cotizacion}
                    </span>
                </div>
                <div style="font-size: 9.5px; color: #0f172a; font-weight: 700; margin-top: 2px;">Fecha Emisión: <strong>\${fEmision}</strong></div>
            </td>
        </tr>
    </table>

    <!-- 1. DATOS DEL SERVICIO INTEGRAL -->`;

code = code.replace(oldHeaderRegex, newHeaderHtml);
fs.writeFileSync(servicePath, code, 'utf8');
console.log('itsPdfService.js actualizado con logo con éxito.');

async function deploy() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  const targets = [
    '/home/nodeadmin/proyectos/lean-services-gsp-prod/src/services/itsPdfService.js',
    '/home/nodeadmin/proyectos/lean-services-gsp/src/services/itsPdfService.js',
    '/home/nodeadmin/proyectos/lean-services-gsp-dev/src/services/itsPdfService.js',
    '/home/nodeadmin/proyectos/lean-services-bch-dev/src/services/itsPdfService.js'
  ];

  for (const t of targets) {
    console.log('Subiendo a:', t);
    await ssh.putFile(servicePath, t);
    await ssh.execCommand(`chown nodeadmin:nodeadmin ${t}`);
  }

  console.log('Reiniciando PM2...');
  await ssh.execCommand('su - nodeadmin -c "pm2 reload 10 && pm2 reload 13"');
  console.log('Despliegue completado.');
  ssh.dispose();
}

deploy().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
