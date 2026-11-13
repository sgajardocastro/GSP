const { execSync } = require('child_process');

try {
  const out = execSync('git log --all -S "kardex" --oneline -n 10', { encoding: 'utf8' });
  console.log('Commits mentioning kardex in changes:');
  console.log(out);
} catch (e) {
  console.error('Error:', e.message);
}
