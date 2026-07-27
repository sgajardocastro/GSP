const fs = require('fs');
const readline = require('readline');

async function processLineByLine(filepath) {
  const fileStream = fs.createReadStream(filepath);
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

processLineByLine('C:\\Users\\sgaja\\.gemini\\antigravity-ide\\brain\\0c657792-c4ea-47dc-bf3a-86fa505866ca\\.system_generated\\logs\\transcript.jsonl');
processLineByLine('C:\\Users\\sgaja\\.gemini\\antigravity-ide\\brain\\76b50cf7-7374-4fe3-bd65-f8d9013709cb\\.system_generated\\logs\\transcript.jsonl');
