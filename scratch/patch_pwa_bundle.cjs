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
import sys, shutil

# 1. 541.e8b54b5f.js (ViajeConductor)
f541 = '/var/www/html/pwa-gsp-prod/js/541.e8b54b5f.js'
shutil.copyfile(f541, f541 + '.bak')

with open(f541, 'r', encoding='utf-8') as f:
    c = f.read()

# Salida horometro
t1 = "if(t>0&&o<t)return void alert(`🚨 Valor Incremental Inválido:\\n\\nEl Horómetro de Salida (${o} HRS) no puede ser menor al último registro acumulado del equipo (${t} HRS).`);"
r1 = "if(t>0&&o<t)console.warn(`[REQ-1143] Horómetro Salida (${o} HRS) menor al acumulado (${t} HRS).`);"

# Salida odometro
t2 = "if(a>0&&e<a)return void alert(`🚨 Valor Incremental Inválido:\\n\\nEl Odómetro de Salida (${e} KM) no puede ser menor al último registro acumulado del equipo (${a} KM).`);"
r2 = "if(a>0&&e<a)console.warn(`[REQ-1143] Odómetro Salida (${e} KM) menor al acumulado (${a} KM).`);"

# Llegada horometro
t3 = "if(t>0&&o<t)return void alert(`🚨 Valor Incremental Inválido:\\n\\nEl Horómetro de Llegada (${o} HRS) no puede ser menor al Horómetro de Salida (${t} HRS).`);"
r3 = "if(t>0&&o<t)console.warn(`[REQ-1143] Horómetro Llegada (${o} HRS) menor a Salida (${t} HRS).`);"

# Llegada odometro
t4 = "if(a>0&&e<a)return void alert(`🚨 Valor Incremental Inválido:\\n\\nEl Odómetro de Llegada (${e} KM) no puede ser menor al Odómetro de Salida (${a} KM).`);"
r4 = "if(a>0&&e<a)console.warn(`[REQ-1143] Odómetro Llegada (${e} KM) menor a Salida (${a} KM).`);"

cnt = 0
for t, r in [(t1, r1), (t2, r2), (t3, r3), (t4, r4)]:
    if t in c:
        c = c.replace(t, r)
        cnt += 1
    else:
        print(f"WARN: target not found: {t[:40]}")

with open(f541, 'w', encoding='utf-8') as f:
    f.write(c)
print(f"541.e8b54b5f.js: {cnt}/4 replacements done.")

# 2. 943.3cbaa13d.js (ReportDiarioIzaje)
f943 = '/var/www/html/pwa-gsp-prod/js/943.3cbaa13d.js'
shutil.copyfile(f943, f943 + '.bak')

with open(f943, 'r', encoding='utf-8') as f:
    c943 = f.read()

# Inicio Report
t_rep = 'if(oo.value>0&&Number(io.horometro_inicio)<oo.value)return no.text=\`⚠️ El Horómetro de Inicio (${io.horometro_inicio} hrs) no puede ser menor al último horómetro registrado (${oo.value} hrs).\`,no.color="error",void(no.show=!0);'
r_rep = 'if(oo.value>0&&Number(io.horometro_inicio)<oo.value)console.warn(\`[REQ-1143] Horómetro de Inicio (${io.horometro_inicio} hrs) menor al sugerido (${oo.value} hrs).\`);'

cnt_rep = 0
if t_rep in c943:
    c943 = c943.replace(t_rep, r_rep)
    cnt_rep += 1
else:
    print(f"WARN: t_rep not found in 943")

with open(f943, 'w', encoding='utf-8') as f:
    f.write(c943)
print(f"943.3cbaa13d.js: {cnt_rep}/1 replacement done.")
`;

  await ssh.execCommand(`cat << 'EOF' > /tmp/patch_pwa_prod.py\n${pyScript}\nEOF`);

  const res = await ssh.execCommand('python3 /tmp/patch_pwa_prod.py');
  console.log('STDOUT:\n', res.stdout);
  console.log('STDERR:\n', res.stderr);

  await ssh.execCommand('rm -f /tmp/patch_pwa_prod.py');

  ssh.dispose();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
