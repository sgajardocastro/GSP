const { spawn } = require('child_process');
const fs = require('fs');

const logStream = fs.createWriteStream('build_debug.log');

const child = spawn('npm.cmd', ['run', 'build'], {
  cwd: process.cwd(),
  env: process.env,
  shell: true
});

child.stdout.pipe(process.stdout);
child.stdout.pipe(logStream);
child.stderr.pipe(process.stderr);
child.stderr.pipe(logStream);

child.on('close', (code) => {
  console.log(`\n=== BUILD FINISHED WITH CODE: ${code} ===\n`);
  process.exit(code);
});
