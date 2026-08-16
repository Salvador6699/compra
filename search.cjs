const fs = require('fs');
const content = fs.readFileSync('src/routes/index.tsx', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{it.formats?.[0]?.prices}')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
