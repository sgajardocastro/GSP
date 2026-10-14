const path = require('path');
const fs = require('fs');

const STORAGE_ROOT = process.env.STORAGE_ROOT || '/u05/LeanDocs';

function buildStoragePath(tenant_code = 'GSP', modulo = 'general', app_env = null) {
  const tCode = String(tenant_code || 'GSP').toUpperCase() === 'GSP' ? 'GSP' : String(tenant_code).toLowerCase();
  const resolvedEnv = app_env || process.env.APP_ENV || (process.env.NODE_ENV === 'production' ? 'prod' : 'dev');
  const env = String(resolvedEnv).toLowerCase();
  const date = new Date();
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  // Siempre usar formato POSIX para almacenamiento en BD
  return path.posix.join(tCode, env, modulo, yyyy, mm);
}

function resolveStoragePath(path_relativo = '', filename = '') {
  if (!path_relativo && !filename) return STORAGE_ROOT;

  // Normalizar separadores de ruta a formato del SO
  const normRel = String(path_relativo || '').replace(/[\\/]+/g, path.sep);

  // 1. Direct path check
  let target = path.join(STORAGE_ROOT, normRel, filename || '');
  if (fs.existsSync(target)) return target;

  if (normRel && fs.existsSync(path.join(STORAGE_ROOT, normRel))) {
    return path.join(STORAGE_ROOT, normRel);
  }

  // Comprobar si normRel existe directamente dentro de public (fallback legacy)
  if (normRel) {
    const cwdDirect = path.join(process.cwd(), 'public', normRel);
    if (fs.existsSync(cwdDirect)) return cwdDirect;
    const devDirect = path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', normRel);
    if (fs.existsSync(devDirect)) return devDirect;
    const prodDirect = path.join('/home/nodeadmin/proyectos/lean-services-gsp-prod/public', normRel);
    if (fs.existsSync(prodDirect)) return prodDirect;
  }

  const candidateDirs = [
    path.join(STORAGE_ROOT, normRel),
    path.join(STORAGE_ROOT, 'GSP', 'dev', 'contratos'),
    path.join(STORAGE_ROOT, 'GSP', 'prod', 'contratos'),
    path.join(STORAGE_ROOT, 'GSP', 'dev', 'contratos', '2026', '10'),
    path.join(STORAGE_ROOT, 'GSP', 'prod', 'contratos', '2026', '10'),
    path.join(process.cwd(), 'public', 'contratos'),
    path.join('/home/nodeadmin/proyectos/lean-services-gsp/public', 'contratos'),
    path.join('/home/nodeadmin/proyectos/lean-services-gsp-prod/public', 'contratos'),
    path.join(STORAGE_ROOT, 'GSP', 'dev', 'reports'),
    path.join(STORAGE_ROOT, 'GSP', 'prod', 'reports'),
    path.join(STORAGE_ROOT, 'GSP', 'dev', 'reports', '2026', '10'),
    path.join(STORAGE_ROOT, 'GSP', 'dev', 'cotizaciones', '2026', '10'),
    path.join(STORAGE_ROOT, 'GSP', 'prod', 'cotizaciones', '2026', '10'),
    path.join(STORAGE_ROOT, 'GSP', 'surveys'),
    path.join(STORAGE_ROOT, 'GSP', 'dev', 'surveys'),
    path.join(STORAGE_ROOT, 'GSP', 'prod', 'surveys'),
    path.join(STORAGE_ROOT, 'GSP', 'general'),
    path.join(STORAGE_ROOT, 'gsp', 'surveys'),
    path.join(STORAGE_ROOT, 'transmac'),
    path.join(STORAGE_ROOT, 'surveys'),
    path.join(__dirname, '../../uploads'),
    path.join(__dirname, '../../uploads', normRel),
    STORAGE_ROOT,
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'public/archivo/transmac'),
    '/home/nodeadmin/proyectos/lean-services-gsp/public',
    '/home/nodeadmin/proyectos/lean-services-gsp/public/archivo/transmac',
    '/home/nodeadmin/proyectos/lean-services-gsp-prod/public',
    '/home/nodeadmin/proyectos/lean-services-gsp-prod/public/archivo/transmac'
  ];

  if (filename) {
    for (const cDir of candidateDirs) {
      const candidateFile = path.join(cDir, filename);
      if (fs.existsSync(candidateFile)) return candidateFile;
    }

    // Búsqueda recursiva profunda en STORAGE_ROOT si el archivo fue reubicado en la migración de la taxonomía
    function searchRecursive(dir, targetFile) {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const found = searchRecursive(full, targetFile);
            if (found) return found;
          } else if (entry.name === targetFile) {
            return full;
          }
        }
      } catch (e) {}
      return null;
    }

    const recursiveFound = searchRecursive(STORAGE_ROOT, filename);
    if (recursiveFound) return recursiveFound;
  }

  return target;
}

module.exports = {
  STORAGE_ROOT,
  buildStoragePath,
  resolveStoragePath
};
