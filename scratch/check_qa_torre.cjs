const { execSync } = require('child_process');

try {
  const content = execSync('git show qa:ejecucion/frontend/src/views/Torre.vue', { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
  console.log('Torre.vue line count in branch qa:', content.split('\n').length);
} catch (e) {
  console.log('Error checking qa branch:', e.message);
}
