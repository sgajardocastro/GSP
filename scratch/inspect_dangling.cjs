const { execSync } = require('child_process');

const blobs = ['cddc81e1b65e5290c5b8047e3426415a61e307e8', '3c34e0f927ab2fada8ebb3c1d97135304fc778a0'];
blobs.forEach(b => {
  try {
    const text = execSync(`git cat-file -p ${b}`, { maxBuffer: 10 * 1024 * 1024, encoding: 'utf8' });
    console.log(`Blob ${b}: size=${text.length}, lines=${text.split('\n').length}`);
    console.log('Preview:', text.substring(0, 150).replace(/\n/g, '\\n'));
  } catch (e) {
    console.log('Error reading blob:', e.message);
  }
});
