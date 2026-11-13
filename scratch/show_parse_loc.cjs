const fs = require('fs');
const path = require('path');
const vuePath = path.resolve('ejecucion/frontend/node_modules/@vue/compiler-sfc');
const { parse } = require(vuePath);

const source = fs.readFileSync('scratch/Torre_final_assembled.vue', 'utf8');
const { descriptor, errors } = parse(source);
console.log('Errors:', JSON.stringify(errors, null, 2));
