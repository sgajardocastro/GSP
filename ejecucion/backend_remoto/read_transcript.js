const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\sgaja\\.gemini\\antigravity-ide\\brain\\610a34a9-91a1-42dc-a29c-8424ef8274f6\\.system_generated\\logs\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'USER_INPUT') {
        console.log(`[${obj.created_at}] User: ${obj.content.substring(0, 500)}`);
      }
    } catch (e) {}
  }
}

processLineByLine();
