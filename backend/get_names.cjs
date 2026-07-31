const fs = require('fs');
const content = fs.readFileSync('../src/lib/base-catalog-prices.ts', 'utf-8');
const names = [...content.matchAll(/name:\s*['"](.*?)['"]/g)].map(m => m[1]);
console.log(JSON.stringify(names, null, 2));
