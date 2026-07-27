const fs = require('fs');

const vueFile = 'd:\\\\SGajardo\\\\Google Drive\\\\Antigravity\\\\Transmac\\\\frontend\\\\src\\\\views\\\\ListadosMinsal.vue';
let content = fs.readFileSync(vueFile, 'utf8');

// The issue is unescaped newlines inside the text values in minsal_data
// Let's just fix it by replacing the reactive block with a JSON parsed object or fixing the newlines.
// It's easier to just do a safe JS parse and replace newlines. But wait, it's just raw code now.

let newContent = content.split('\n').map(line => {
   if (line.includes('text: \'') && !line.endsWith('},') && !line.endsWith('}, ')) {
       // It's an unterminated line! Wait, no, we can just remove newlines between text: and closing bracket.
       // actually, it's simpler
   }
   return line;
}).join('\n');

// A reliable way is to just find literal newlines inside strings.
// But JavaScript string literals don't allow newlines anyway unless using backticks.
// Let's replace single quotes with backticks for the `text:` and `ref:` fields ? No, backticks might have ${ inside.
// Better: just remove literal \r and \n that exist *between* quotes if they span multiple lines.

let fixedContent = '';
let inString = false;
for (let i = 0; i < content.length; i++) {
    const c = content[i];
    if (c === "'" && (i === 0 || content[i-1] !== '\\')) {
        inString = !inString;
    }
    if (inString && (c === '\n' || c === '\r')) {
        fixedContent += ' '; // replace newline with space
    } else {
        fixedContent += c;
    }
}

fs.writeFileSync(vueFile, fixedContent);
console.log('Fixed newlines');
