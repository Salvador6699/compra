const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.tsx');
files.forEach(f => {
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('<p') || line.includes('prices')) {
      console.log(`${f}:${i+1}: ${line}`);
    }
  });
});
