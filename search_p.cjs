const fs = require('fs');
const lines = fs.readFileSync('src/routes/index.tsx', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<p') || lines[i].includes('</p>')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
