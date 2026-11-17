const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function testPatchSimulation() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const testScript = `
  const pool = require('/home/nodeadmin/proyectos/lean-services-gsp-prod/src/config/postgresPool');

  (async () => {
    // 1. Verificar datos de proyecto 75
    const proyRes = await pool.query('SELECT id_proyecto, codi_proyecto, json_field FROM tpry_proyecto WHERE id_proyecto = 75');
    const p = proyRes.rows[0];
    const lsRes = await pool.query('SELECT * FROM tpry_linea_servicio WHERE id_proyecto = 75 AND activo = true ORDER BY orden ASC');
    console.log('Lineas de servicio en BD:', lsRes.rows.length);

    // 2. Simular mapeo de tarifas por equipo
    const lineas = lsRes.rows;
    const testCases = [
      { id_equipo: 39, patente: 'TLXF.37-9', modelo: 'Grúa 70 Ton' },
      { id_equipo: 60, patente: 'GDZG.36-4', modelo: 'Grúa Horquilla 16 Ton' },
      { id_equipo: 82, patente: 'KDYS.90-1', modelo: 'Camión Transporte' }
    ];

    testCases.forEach(tc => {
      const match = lineas.find(l => {
        const u = String(l.unidad || '').toUpperCase();
        const esHoraria = u.includes('HORA');
        if (!esHoraria) return false;
        if (l.id_equipo_sugerido && Number(l.id_equipo_sugerido) === Number(tc.id_equipo)) return true;
        const desc = \`\${l.subcategoria || ''} \${l.descripcion || ''}\`.toUpperCase();
        if (tc.patente && desc.includes(tc.patente)) return true;
        if (tc.modelo && desc.includes(tc.modelo.toUpperCase())) return true;
        return false;
      });
      console.log(\`Equipo \${tc.patente} (id \${tc.id_equipo}): Tarifa resuelta = \${match ? match.valor_unitario : 'NO_MATCH'}\`);
    });

    process.exit(0);
  })();
  `;

  await ssh.execCommand(`cat << 'EOF' > /tmp/test_patch_sim.js\n${testScript}\nEOF`);
  const out = await ssh.execCommand('su - nodeadmin -c "cd /home/nodeadmin/proyectos/lean-services-gsp-prod && node /tmp/test_patch_sim.js"');
  console.log(out.stdout);
  if (out.stderr) console.error(out.stderr);
  ssh.dispose();
}

testPatchSimulation().catch(console.error);
