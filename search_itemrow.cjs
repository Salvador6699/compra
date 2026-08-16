const fs = require('fs');
const lines = fs.readFileSync('src/components/features/ItemRow.tsx', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<p') || lines[i].includes('prices')) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
