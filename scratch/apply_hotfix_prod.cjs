const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function run() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  const pyScript = `
import sys

# 1. viajeModel.js
with open('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/viajeModel.js', 'r', encoding='utf-8') as f:
    v = f.read()

target_salida = "throw new Error(\`El Hor\u00f3metro de salida (\${horometro_inicial} hrs) no puede ser menor al \u00faltimo registro acumulado del equipo (\${acum.h_chasis} hrs).\`);"
repl_salida = "console.warn(\`[REQ-1143] Hor\u00f3metro de salida (\${horometro_inicial} hrs) menor al acumulado (\${acum.h_chasis} hrs) para equipo \${eqIdVal}. Se permite registro temporalmente.\`);"

target_llegada = "throw new Error(\`El Hor\u00f3metro de llegada (\${horometro_final} hrs) no puede ser menor al Hor\u00f3metro de salida (\${pv.horometro_inicial} hrs).\`);"
repl_llegada = "console.warn(\`[REQ-1143] Hor\u00f3metro de llegada (\${horometro_final} hrs) menor a salida (\${pv.horometro_inicial} hrs) en viaje \${token_viaje}. Se permite registro temporalmente.\`);"

count_v = 0
if target_salida in v:
    v = v.replace(target_salida, repl_salida)
    count_v += 1
if target_llegada in v:
    v = v.replace(target_llegada, repl_llegada)
    count_v += 1

with open('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/models/viajeModel.js', 'w', encoding='utf-8') as f:
    f.write(v)

print(f"viajeModel.js: {count_v} replacements done.")

# 2. reportDiarioController.js
with open('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js', 'r', encoding='utf-8') as f:
    r = f.read()

target_ini = """          if (minHoro > 0 && Number(horometro_inicio) < minHoro) {
            return res.status(422).json({
              success: false,
              error: \`El Hor\u00f3metro de Inicio (\${horometro_inicio} hrs) no puede ser menor al \u00faltimo registro acumulado del equipo (\${minHoro} hrs).\`
            });
          }"""

repl_ini = """          if (minHoro > 0 && Number(horometro_inicio) < minHoro) {
            console.warn(\`[REQ-1143] Hor\u00f3metro de Inicio (\${horometro_inicio} hrs) menor al acumulado (\${minHoro} hrs) para equipo \${id_equipo}. Se permite registro temporalmente.\`);
          }"""

count_r = 0
if target_ini in r:
    r = r.replace(target_ini, repl_ini)
    count_r += 1
else:
    print("WARNING: target_ini not found in reportDiarioController.js")

target_ter = """      if (horometro_inicio !== undefined && horometro_inicio !== null && horometro_termino !== undefined && horometro_termino !== null) {
        if (Number(horometro_termino) < Number(horometro_inicio)) {
          return res.status(422).json({
            success: false,
            error: \`El Hor\u00f3metro Final (\${horometro_termino} hrs) no puede ser menor al Hor\u00f3metro Inicial (\${horometro_inicio} hrs).\`
          });
        }
      }"""

repl_ter = """      if (horometro_inicio !== undefined && horometro_inicio !== null && horometro_termino !== undefined && horometro_termino !== null) {
        if (Number(horometro_termino) < Number(horometro_inicio)) {
          console.warn(\`[REQ-1143] Hor\u00f3metro Final (\${horometro_termino} hrs) menor al Inicial (\${horometro_inicio} hrs). Se permite registro temporalmente.\`);
        }
      }"""

if target_ter in r:
    r = r.replace(target_ter, repl_ter)
    count_r += 1
else:
    print("WARNING: target_ter not found in reportDiarioController.js")

with open('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/controllers/reportDiarioController.js', 'w', encoding='utf-8') as f:
    f.write(r)

print(f"reportDiarioController.js: {count_r} replacements done.")
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/patch_backend_prod.py\n${pyScript}\nEOF`);

  const res = await ssh.execCommand('python3 /tmp/patch_backend_prod.py');
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  await ssh.execCommand('rm -f /tmp/patch_backend_prod.py');

  const diffRes = await ssh.execCommand('git diff src/models/viajeModel.js src/controllers/reportDiarioController.js', {
    cwd: '/home/nodeadmin/proyectos/lean-services-gsp-prod'
  });
  console.log('GIT DIFF EN PROD:\n', diffRes.stdout);

  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 restart 13"');
  console.log('REINICIO PM2 PROD:\n', pm2Res.stdout);

  ssh.dispose();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
