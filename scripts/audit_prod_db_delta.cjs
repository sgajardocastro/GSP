const { NodeSSH } = require('../ejecucion/backend_remoto/node_modules/node-ssh');
const ssh = new NodeSSH();

async function checkEnvironments() {
  await ssh.connect({
    host: '138.255.103.18',
    username: 'root',
    password: 'lgbl2025.',
    port: 1295
  });

  console.log('=== 1. RUTAS Y ARCHIVOS DE DEV Y PROD EN PM2 ===');
  const pm2Res = await ssh.execCommand('su - nodeadmin -c "pm2 describe 10"');
  const pm2ProdRes = await ssh.execCommand('su - nodeadmin -c "pm2 describe 13"');
  
  const extractInfo = (out) => {
    return out.split('\n').filter(l => 
      l.includes('script path') || 
      l.includes('exec cwd') || 
      l.includes('name') || 
      l.includes('status') ||
      l.includes('PORT')
    ).join('\n');
  };

  console.log('--- DEV (PM2 10) ---');
  console.log(extractInfo(pm2Res.stdout));

  console.log('--- PROD (PM2 13) ---');
  console.log(extractInfo(pm2ProdRes.stdout));

  console.log('\n=== 2. CONTENIDO DE .env DEV vs PROD ===');
  // Get paths
  const devEnv = await ssh.execCommand('cat /home/nodeadmin/proyectos/lean-services-gsp/.env 2>/dev/null');
  console.log('--- DEV .env (DB settings) ---');
  devEnv.stdout.split('\n').filter(l => l.includes('DB') || l.includes('SCHEMA') || l.includes('PORT') || l.includes('ENV')).forEach(l => console.log(l));

  // Check where prod backend is
  const prodCwdMatch = pm2ProdRes.stdout.match(/exec cwd\s*│\s*([^\s│]+)/);
  const prodCwd = prodCwdMatch ? prodCwdMatch[1] : '/home/nodeadmin/proyectos/lean-services-gsp-prod';
  console.log(`\nProd cwd detectado: ${prodCwd}`);
  const prodEnv = await ssh.execCommand(`cat ${prodCwd}/.env 2>/dev/null`);
  console.log('--- PROD .env (DB settings) ---');
  prodEnv.stdout.split('\n').filter(l => l.includes('DB') || l.includes('SCHEMA') || l.includes('PORT') || l.includes('ENV')).forEach(l => console.log(l));

  ssh.dispose();
}

checkEnvironments().catch(console.error);
