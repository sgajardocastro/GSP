const fs = require('fs');

const content = fs.readFileSync('ejecucion/frontend/src/views/Torre.vue', 'utf8');
const scriptMatch = content.match(/<script setup>([\s\S]*?)<\/script>/);
const scriptCode = scriptMatch[1];

// Find all function calls in script
const callMatches = scriptCode.matchAll(/\b([a-zA-Z0-9_$]+)\s*\(/g);
const called = new Set();
for (const m of callMatches) {
  called.add(m[1]);
}

// Built-ins and common methods
const builtins = new Set([
  'ref', 'computed', 'watch', 'onMounted', 'onUnmounted', 'nextTick', 'reactive', 'toRef', 'toRefs',
  'Date', 'String', 'Number', 'Math', 'Array', 'Set', 'Map', 'Object', 'Boolean', 'RegExp', 'Error',
  'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'console', 'Promise', 'JSON',
  'if', 'for', 'switch', 'while', 'catch', 'typeof', 'instanceof',
  // Array/String methods
  'slice', 'split', 'join', 'push', 'pop', 'shift', 'unshift', 'splice', 'concat', 'reverse', 'sort',
  'filter', 'map', 'forEach', 'reduce', 'reduceRight', 'some', 'every', 'find', 'findIndex', 'includes',
  'indexOf', 'lastIndexOf', 'flat', 'flatMap',
  'toLowerCase', 'toUpperCase', 'trim', 'trimStart', 'trimEnd', 'replace', 'replaceAll', 'match', 'matchAll',
  'charAt', 'charCodeAt', 'padStart', 'padEnd', 'startsWith', 'endsWith', 'repeat', 'substring',
  'toFixed', 'toLocaleString', 'toString', 'valueOf',
  'getFullYear', 'getMonth', 'getDate', 'getDay', 'getHours', 'getMinutes', 'getSeconds', 'getMilliseconds',
  'getTime', 'getTimezoneOffset', 'setHours', 'setDate', 'setMonth', 'setFullYear',
  'has', 'get', 'set', 'add', 'delete', 'clear', 'keys', 'values', 'entries',
  'then', 'catch', 'finally', 'all', 'allSettled', 'race', 'resolve', 'reject',
  'assign', 'freeze', 'from', 'isArray',
  'min', 'max', 'round', 'floor', 'ceil', 'abs', 'sqrt', 'pow', 'random',
  'log', 'warn', 'error', 'info', 'table',
  'stringify', 'parse',
  // Vue template helpers or router
  'useRoute', 'useRouter', 'useAuthStore', 'formatMoneda'
]);

const missing = [];
for (const fn of called) {
  if (builtins.has(fn)) continue;
  // Check if defined in scriptCode or imported
  const isConst = new RegExp(`\\b(const|let|var|function)\\s+${fn}\\b`).test(scriptCode);
  const isImport = new RegExp(`\\b${fn}\\b.*from`).test(scriptCode) || new RegExp(`import\\s+.*\\b${fn}\\b`).test(scriptCode);
  const isDestructured = new RegExp(`\\{\\s*.*\\b${fn}\\b.*\\}\\s*=`).test(scriptCode);
  if (!isConst && !isImport && !isDestructured) {
    missing.push(fn);
  }
}

console.log('Potentially undefined function calls in script:', missing);
