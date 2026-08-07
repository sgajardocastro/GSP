const path = require('path');
const fs = require('fs');

const STORAGE_ROOT = process.env.STORAGE_ROOT || '/u05/LeanDocs';

function buildStoragePath(tenant_code = 'GSP', modulo = 'general', app_env = 'dev') {
  const tCode = String(tenant_code || 'GSP').toUpperCase() === 'GSP' ? 'GSP' : String(tenant_code).toLowerCase();
  const env = String(app_env || process.env.APP_ENV || process.env.NODE_ENV || 'dev').toLowerCase();
  const date = new Date();
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return path.join(tCode, env, modulo, yyyy, mm);
}

function resolveStoragePath(path_relativo = '', filename = '') {
  if (!path_relativo && !filename) return STORAGE_ROOT;

  // 1. Direct path check
  let target = path.join(STORAGE_ROOT, path_relativo || '', filename || '');
  if (filename && fs.existsSync(target)) return target;

  const candidateDirs = [
    path.join(STORAGE_ROOT, path_relativo || ''),
    path.join(STORAGE_ROOT, 'GSP', 'surveys'),
    path.join(STORAGE_ROOT, 'GSP', 'dev', 'surveys'),
    path.join(STORAGE_ROOT, 'GSP', 'prod', 'surveys'),
    path.join(STORAGE_ROOT, 'GSP', 'general'),
    path.join(STORAGE_ROOT, 'gsp', 'surveys'),
    path.join(STORAGE_ROOT, 'transmac'),
    path.join(STORAGE_ROOT, 'surveys'),
    STORAGE_ROOT,
    '/home/nodeadmin/proyectos/lean-services-gsp/public',
    '/home/nodeadmin/proyectos/lean-services-gsp/public/archivo/transmac'
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
