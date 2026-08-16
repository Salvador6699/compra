const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, 'src/routes/index.tsx');

let content = fs.readFileSync(p, 'utf8');

// Replace it.image
content = content.replace(/it\.image/g, 'it.formats?.[0]?.image');

// Replace it.prices
content = content.replace(/it\.prices/g, 'it.formats?.[0]?.prices');

// Replace any remaining syntax errors for JSX
// Let's just write back and check if it compiles.
fs.writeFileSync(p, content, 'utf8');
console.log('Fixed it.image and it.prices in index.tsx');
