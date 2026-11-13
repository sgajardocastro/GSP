const fs = require('fs');
const path = require('path');

function searchDir(dir) {
  try {
    const list = fs.readdirSync(dir);
    list.forEach(item => {
      const full = path.join(dir, item);
      try {
        const stat = fs.statSync(full);
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.git')) {
          searchDir(full);
        } else if (item.toLowerCase().includes('torre')) {
          console.log(full, 'size:', stat.size);
        }
      } catch (e) {}
    });
  } catch (e) {}
}

console.log('Searching brain dir:');
searchDir('C:/Users/sgaja/.gemini/antigravity/brain/44d0febd-8ac8-495c-b727-d3eb891b4da5');
console.log('Searching project scratch:');
searchDir('scratch');
