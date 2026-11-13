const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');

async function main() {
  const ssh = new NodeSSH();
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.',
    port: 1295
  });

  const sql = `
UPDATE sch_leangsp_prod.tits_jornada_detalle 
SET tipo_servicio = 'Valor Fijo', tarifa_hora = 0 
WHERE id_its IN (SELECT id_its FROM sch_leangsp_prod.tits_informe_termino WHERE id_proyecto = 32);

UPDATE sch_leangsp_prod.tits_jornada_detalle 
SET tipo_servicio = 'Valor Fijo' 
WHERE tipo_servicio = 'Valor Fijo / Jornada';

UPDATE sch_leangsp.tits_jornada_detalle 
SET tipo_servicio = 'Valor Fijo' 
WHERE tipo_servicio = 'Valor Fijo / Jornada';

SELECT j.id_jornada, j.id_its, j.fecha, j.tipo_servicio, j.tarifa_hora, j.subtotal, j.numero_report 
FROM sch_leangsp_prod.tits_jornada_detalle j 
JOIN sch_leangsp_prod.tits_informe_termino i ON i.id_its = j.id_its 
WHERE i.id_proyecto = 32;
`;

  // Escribir el script SQL en un archivo temporal remoto y ejecutarlo
  await ssh.execCommand(`cat << 'EOF' > /tmp/update_tipo_servicio.sql\n${sql}\nEOF`);
  const res = await ssh.execCommand('su - postgres -c "psql -d postgres -f /tmp/update_tipo_servicio.sql"');
  console.log('Resultado ejecución SQL:\n', res.stdout);
  if (res.stderr) console.error('Error:', res.stderr);

  ssh.dispose();
}

main().catch(console.error);
