const path = require('path');
const { NodeSSH } = require(path.resolve(__dirname, '../ejecucion/backend_remoto/node_modules/node-ssh'));
const ssh = new NodeSSH();

async function main() {
  await ssh.connect({
    host: '138.255.103.18',
    port: 1295,
    username: 'root',
    password: process.env.SSH_PASSWORD || 'lgbl2025.'
  });

  console.log('--- 1. EJECUTAR RESET EN PRODUCCIÓN (sch_leangsp_prod) ---');
  const sqlProd = `
    BEGIN;
    UPDATE sch_leangsp_prod.tequ_equipo
    SET odometro_acumulado = 0.00,
        fecha_ultima_lectura = CURRENT_TIMESTAMP,
        fuente_ultima_lectura = 'RESET_DATAFIX_SOPORTE'
    WHERE id_equipo = 36;

    UPDATE sch_leangsp_prod.tequ_equipo
    SET odometro_acumulado = 0.00,
        fecha_ultima_lectura = CURRENT_TIMESTAMP,
        fuente_ultima_lectura = 'RESET_DATAFIX_SOPORTE'
    WHERE id_equipo = 43 AND odometro_acumulado = 145820.50;
    COMMIT;
  `;
  const resProd = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlProd.replace(/\n/g, ' ')}\\""`);
  console.log('PROD OUTPUT:', resProd.stdout || resProd.stderr);

  console.log('--- 2. EJECUTAR RESET EN DESARROLLO (sch_leangsp) ---');
  const sqlDev = `
    BEGIN;
    UPDATE sch_leangsp.tequ_equipo
    SET odometro_acumulado = 0.00,
        fecha_ultima_lectura = CURRENT_TIMESTAMP,
        fuente_ultima_lectura = 'RESET_DATAFIX_SOPORTE'
    WHERE id_equipo IN (36, 43);
    COMMIT;
  `;
  const resDev = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlDev.replace(/\n/g, ' ')}\\""`);
  console.log('DEV OUTPUT:', resDev.stdout || resDev.stderr);

  console.log('--- 3. VERIFICACIÓN POST-RESET EN PRODUCCIÓN ---');
  const sqlVerify = `
    SELECT id_equipo, patente, modelo, marca, odometro_acumulado,
           horometro_grua_acumulado, horometro_chasis_acumulado,
           fuente_ultima_lectura, fecha_ultima_lectura
    FROM sch_leangsp_prod.tequ_equipo
    WHERE id_equipo IN (36, 43);
  `;
  const resVerify = await ssh.execCommand(`su - postgres -c "psql -d postgres -c \\"${sqlVerify.replace(/\n/g, ' ')}\\""`);
  console.log('VERIFICACION PROD:\n', resVerify.stdout);

  ssh.dispose();
}

main().catch(err => {
  console.error('ERROR:', err);
  ssh.dispose();
});
