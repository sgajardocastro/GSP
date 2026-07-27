const fs = require('fs');
const path = require('path');

function searchTranscripts(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchTranscripts(fullPath);
    } else if (file === 'transcript.jsonl') {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('logo-sanpablo') || content.includes('wkhtmltopdf')) {
        console.log(`Found in: ${fullPath}`);
        // print the user messages
        const lines = content.split('\n');
        for (const line of lines) {
          try {
            const obj = JSON.parse(line);
            if (obj.type === 'USER_INPUT') {
              console.log(`[${obj.created_at}] User: ${obj.content.substring(0, 200)}`);
            }
          } catch(e) {}
        }
      }
    }
  }
}

searchTranscripts('C:\\Users\\sgaja\\.gemini\\antigravity-ide\\brain\\');
